# k8s-shop-project
This project implements a small three-tier web shop consisting of a MySQL database, a Node.js / Express backend, and a static HTML/CSS/JavaScript frontend. The application allows user to view a list of products and add new items via a simple REST API, with all data stored persistently in the database.

The focus of the assignment is not on complex business logic, but on designing and operating a container-orchestrated deployment. As part of the coursework, the cluster is provisioned, application components are containerized, and Kubernetes manifests are defined for database, backend, frontend, and Ingress. The goal is to demonstrate a reproducible, standards-compliant deployment pipeline for a stateful web application, including secure configuration of secrets, resource requests/limits, health checks, and path-based routing via an Ingress controller.

## Startup
This project runs on an Amazon EKS cluster using private container images from GitHub Container Registry (GHCR). The following steps in the README describe how to deploy the complete web shop (MySQL database, Node.js backend and the static frontend) into an existing Amazon EKS cluster using NGINX Ingress controller for unified external access.

### 1. Prerequisites - Create the EKS cluster
Make sure you have a working EKS cluster and kubectl configured with access to it. You should have at least two worker nodes to run database, backend, and frontend reliably. When using EKS on AWS there is a ClusterConfiguration available that can be applied using the command:

```bash
eksctl create cluster -f cluster.yaml
```
The `cluster.yaml` file defines the cluster name, region, Kubernetes version, node group configuration. Please ensure that there is an IAM-Service Account available that has at least the role AmazonEKS_EBS_CSI_DriverRole to manage the persistent storage, as well as the AmazonEKSClusterAutoscalerPolicy to autoscale the available resources. 

### 2. install NGINX Ingress Controller
Install the NGINX Ingress controller e.g. via HELM. It provides a LoadBalancer that will later expose both frontend and backend under a single external IP.

```bash
helm repo add ingress-nginx https://kubernetes.github.io/ingress-nginx
helm repo update

helm upgrade --install ingress-nginx ingress-nginx \
  --repo https://kubernetes.github.io/ingress-nginx \
  --namespace ingress-nginx --create-namespace 
```
### 3. create StorageClass and ConfigMap
create the StorageClase for persistent MySQL volumes based on Amazons EBS gp3.

```bash
kubectl apply -f k8s/gp3-storageclass.yaml
```

create a ConfigMap needed later for database initialization.

```bash
kubectl create configmap shopdb-init-sql --from-file=shopdb-init.sql=database/shopdb-init.sql
```
### 4. mysql-secret.yaml?

```bash
kubectl apply -f k8s/mysql-secret.yaml
```
### 5. Deploy Database and run init-job
First deploy the MySQL workload and service, then run a one-off Job that creates the schema, user, and seed data.

```bash
kubectl apply -f k8s/database.yaml

# Wait until the DB pod is running

kubectl apply -f k8s/shopdb-init-job.yaml
```
The job should complete sucessful before you proceed.

### 6. create Secrets for database and ghcr access
Create one secret for the application database user and one Docker registry secret to pull images from GitHub Container Registry.
```bash
kubectl create secret generic mysql-app-secret \
  --from-literal=db-user=shop_app \
  --from-literal=mysql-app-password='CHANGE_ME_STRONG_PASSWORD'

kubectl create secret docker-registry ghcr-auth \
  --docker-server=https://ghcr.io \
  --docker-username=GITHUB_USERNAME \
  --docker-password='GHCR_PAT' \
  --docker-email=YOU@example.com
```

### 7. Deploy Backend
The backend connects to MySQL using environment variables and exposes health and API endpoints under /api/health and api/items.
```bash
kubectl apply -f k8s/backend.yaml
```

### 8. Deploy Frontend
The frontend service is served as static files by NGINX.
```bash
kubectl apply -f k8s/frontend.yaml
```
The frontend JavaScript calls the backend using relative API paths such as /api/items, which will be routed by the Ingress.

### 9. apply Ingress-Routing
Create an Ingress resource that routes / to the frontend service and /api to the backend service, using the NGINX Ingress controller installed earlier.
```bash
kubectl apply -f k8s/ingress.yaml
```

### 10. Test the webshop
Retrieve the external address and test the shop in the browser.
```bash
kubectl get ingress shop-ingress
```
http://<INGRESS-IP>/ → frontend (index page)
http://<INGRESS-IP>/health.html → frontend health page
http://<INGRESS-IP>/api/health → backend health endpoint
http://<INGRESS-IP>/api/items → JSON list of products