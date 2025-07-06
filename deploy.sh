#!/bin/bash

# Enhanced deployment script for MFE applications
# Usage: ./deploy.sh [environment] [apps...]
# Example: ./deploy.sh production mfe-host mfe-console

set -e

# Configuration
PROJECT_ID="mfe-project-464600"
REGION="us-central1"
REPO_NAME="mfe-registry"
CLUSTER_NAME="mfe-cluster"
CLUSTER_ZONE="us-central1"
REGISTRY_HOST="us-central1-docker.pkg.dev"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

check_prerequisites() {
    log_info "Checking prerequisites..."
    
    # Check if gcloud is installed
    if ! command -v gcloud &> /dev/null; then
        log_error "gcloud CLI is not installed"
        exit 1
    fi
    
    # Check if kubectl is installed
    if ! command -v kubectl &> /dev/null; then
        log_error "kubectl is not installed"
        exit 1
    fi
    
    # Check if docker is installed
    if ! command -v docker &> /dev/null; then
        log_error "docker is not installed"
        exit 1
    fi
    
    log_success "All prerequisites are met"
}

authenticate_gcp() {
    log_info "Authenticating with Google Cloud..."
    
    # Configure docker for artifact registry
    gcloud auth configure-docker $REGISTRY_HOST --quiet
    
    # Get GKE credentials
    gcloud container clusters get-credentials $CLUSTER_NAME \
        --zone $CLUSTER_ZONE \
        --project $PROJECT_ID
    
    log_success "GCP authentication completed"
}

build_and_push_app() {
    local app=$1
    local tag=${2:-latest}
    
    log_info "Building and pushing $app..."
    
    # Set build args based on app
    local build_args=""
    if [ "$app" == "mfe-host" ]; then
        build_args="--build-arg VITE_CONSOLE_REMOTE_URL=http://34.54.233.86/console/assets/remoteEntry.js"
    elif [ "$app" == "mfe-console" ]; then
        build_args="--build-arg VITE_BASE_URL=/console/"
    fi
    
    # Build image
    local image_uri="${REGISTRY_HOST}/${PROJECT_ID}/${REPO_NAME}/${app}:${tag}"
    
    log_info "Building image: $image_uri"
    docker build $build_args -t $image_uri ./$app
    
    # Push image
    log_info "Pushing image: $image_uri"
    docker push $image_uri
    
    log_success "Built and pushed $app successfully"
}

deploy_to_k8s() {
    log_info "Deploying to Kubernetes..."
    
    # Apply manifests
    kubectl apply -f k8s/
    
    # Wait for deployments to be ready
    log_info "Waiting for deployments to be ready..."
    kubectl rollout status deployment/mfe-host --timeout=600s
    kubectl rollout status deployment/mfe-console --timeout=600s
    
    log_success "Deployment completed successfully"
}

verify_deployment() {
    log_info "Verifying deployment..."
    
    # Check deployment status
    echo "=== Deployment Status ==="
    kubectl get deployments -o wide
    
    echo ""
    echo "=== Pod Status ==="
    kubectl get pods -o wide
    
    echo ""
    echo "=== Service Status ==="
    kubectl get services
    
    echo ""
    echo "=== Ingress Status ==="
    kubectl get ingress -o wide
    
    # Test endpoints
    local external_ip=$(kubectl get ingress mfe-ingress -o jsonpath='{.status.loadBalancer.ingress[0].ip}')
    
    if [ -z "$external_ip" ]; then
        log_warning "No external IP found for ingress"
        return 1
    fi
    
    log_info "Testing endpoints at IP: $external_ip"
    
    # Test host endpoint
    local host_status=$(curl -o /dev/null -s -w "%{http_code}" http://$external_ip/ || echo "000")
    if [ "$host_status" == "200" ]; then
        log_success "Host endpoint is healthy (HTTP $host_status)"
    else
        log_error "Host endpoint is unhealthy (HTTP $host_status)"
        return 1
    fi
    
    # Test console endpoint
    local console_status=$(curl -o /dev/null -s -w "%{http_code}" http://$external_ip/console/ || echo "000")
    if [ "$console_status" == "200" ]; then
        log_success "Console endpoint is healthy (HTTP $console_status)"
    else
        log_error "Console endpoint is unhealthy (HTTP $console_status)"
        return 1
    fi
    
    log_success "All endpoints are healthy"
    echo ""
    echo "🎉 Deployment verification completed successfully!"
    echo "Host: http://$external_ip/"
    echo "Console: http://$external_ip/console/"
}

show_help() {
    cat << EOF
Enhanced MFE Deployment Script

Usage: $0 [OPTIONS] [APPS...]

OPTIONS:
    -h, --help              Show this help message
    -e, --environment ENV   Set environment (default: production)
    -t, --tag TAG          Set image tag (default: latest)
    --build-only           Only build and push images, don't deploy
    --deploy-only          Only deploy, don't build images
    --verify-only          Only verify deployment

APPS:
    mfe-host               Deploy MFE host application
    mfe-console            Deploy MFE console application
    (if no apps specified, both will be deployed)

Examples:
    $0                                    # Deploy both apps
    $0 mfe-host                          # Deploy only host
    $0 -t v1.2.3 mfe-console            # Deploy console with specific tag
    $0 --build-only                      # Only build and push images
    $0 --deploy-only                     # Only deploy existing images
    $0 --verify-only                     # Only verify current deployment

EOF
}

# Parse command line arguments
ENVIRONMENT="production"
TAG="latest"
BUILD_ONLY=false
DEPLOY_ONLY=false
VERIFY_ONLY=false
APPS=()

while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--help)
            show_help
            exit 0
            ;;
        -e|--environment)
            ENVIRONMENT="$2"
            shift 2
            ;;
        -t|--tag)
            TAG="$2"
            shift 2
            ;;
        --build-only)
            BUILD_ONLY=true
            shift
            ;;
        --deploy-only)
            DEPLOY_ONLY=true
            shift
            ;;
        --verify-only)
            VERIFY_ONLY=true
            shift
            ;;
        mfe-host|mfe-console)
            APPS+=("$1")
            shift
            ;;
        *)
            log_error "Unknown option: $1"
            show_help
            exit 1
            ;;
    esac
done

# Default to both apps if none specified
if [ ${#APPS[@]} -eq 0 ]; then
    APPS=("mfe-host" "mfe-console")
fi

# Main execution
log_info "Starting MFE deployment process..."
log_info "Environment: $ENVIRONMENT"
log_info "Tag: $TAG"
log_info "Apps: ${APPS[*]}"

# Check prerequisites
check_prerequisites

# Authenticate with GCP
if [ "$VERIFY_ONLY" = false ]; then
    authenticate_gcp
fi

# Build and push images
if [ "$DEPLOY_ONLY" = false ] && [ "$VERIFY_ONLY" = false ]; then
    for app in "${APPS[@]}"; do
        build_and_push_app "$app" "$TAG"
    done
fi

# Deploy to Kubernetes
if [ "$BUILD_ONLY" = false ] && [ "$VERIFY_ONLY" = false ]; then
    deploy_to_k8s
fi

# Verify deployment
if [ "$BUILD_ONLY" = false ]; then
    verify_deployment
fi

log_success "🎉 All operations completed successfully!"
