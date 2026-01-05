# k8s-shop-project
This project implements a small three-tier web shop consisting of a MySQL database, a Node.js / Express backend, and a static HTML/CSS/JavaScript frontend. The application allows user to view a list of products and add new items via a simple REST API, with all data stored persistently in the database.

The focus of the assignment is not on complex business logic, but on designing and operating a container-orchestrated deployment. As part of the coursework, the cluster is provisioned, application components are containerized, and Kubernetes manifests are defined for database, backend, frontend, and Ingress. The goal is to demonstrate a reproducible, standards-compliant deployment pipeline for a stateful web application, including secure configuration of secrets, resource requests/limits, health checks, and path-based routing via an Ingress controller.

## Architecture overview
- Database: MySQL instance with persistent storage based on Amazon EBS gp3.
- Backend: Node.js / Express API exposing health endpoint at `api/health` and data endpoint `api/items`.
- Frontend: static web UI served by NGINX, using relative API calls to `api/...`
- Ingress: NGINX Ingress Controller routing `/` to the frontend and `/api` to the backend

## Prerequisites
This project assumes an existing Amazon EKS cluster and container images hosted on GitHub Container Registry (GHCR).

You need:
- A working EKS cluster with `kubectl` configured.
- At least two worker nodes to reliably run database, backend and the frontend.
- An IAM service account with at least:
  - `AmazonEKS_EBS_CSI_DriverRole` for managing persistent storage.
  - `AmazonEKSClusterAutoscalerPolicy` for resource autoscaling.

An example cluster can be created with: 
```bash
eksctl create cluster -f cluster.yaml
```
The cluster file defines, among other things, the cluster name, region, Kubernetes version, and node group configuration.

## Deployment steps

### 1. install NGINX Ingress Controller
Install the NGINX Ingress controller using HELM. It will later provide a Loadbalancer with an external IP that exposes both frontend and backend.

```bash
helm repo add ingress-nginx https://kubernetes.github.io/ingress-nginx
helm repo update

helm upgrade --install ingress-nginx ingress-nginx \
  --repo https://kubernetes.github.io/ingress-nginx \
  --namespace ingress-nginx --create-namespace 
```

### 2. create StorageClass and ConfigMap
create the StorageClase for persistent MySQL volumes based on Amazons EBS gp3.

```bash
kubectl apply -f k8s/gp3-storageclass.yaml
```

create a ConfigMap needed later for database initialization.

```bash
kubectl create configmap shopdb-init-sql --from-file=shopdb-init.sql=database/shopdb-init.sql
```

### 3. apply database secret
apply the database secret to acess the database as a root user.

```bash
kubectl apply -f k8s/mysql-secret.yaml
```
### 4. Deploy Database and run init-job
First deploy the MySQL workload and service, then run a one-off Job that creates the schema, user, and seed data.

```bash
kubectl apply -f k8s/database.yaml

# Wait until the DB pod is running

kubectl apply -f k8s/shopdb-init-job.yaml
```
The job should complete sucessful before you proceed.

### 5. create Secrets for database app user
Secret for the application database user:
```bash
kubectl create secret generic mysql-app-secret \
  --from-literal=db-user=shop_app \
  --from-literal=mysql-app-password='CHANGE_ME_STRONG_PASSWORD'
```

### 6. Deploy Backend
The backend connects to MySQL using environment variables and exposes health and API endpoints under `/api/health` and `api/items`.
```bash
kubectl apply -f k8s/backend.yaml
```

### 7. Deploy Frontend
The frontend service is served as static files by NGINX.
```bash
kubectl apply -f k8s/frontend.yaml
```
The frontend JavaScript calls the backend using relative API paths such as `/api/items`, which will be routed by the Ingress.

### 8. apply Ingress-Routing
Create an Ingress resource that routes `/` to the frontend service and `/api` to the backend service, using the NGINX Ingress controller installed earlier.
```bash
kubectl apply -f k8s/ingress.yaml
```

## Test the webshop
Retrieve the external address and test the shop in the browser.
```bash
kubectl get ingress shop-ingress
```
Explore URLs:
- http://<INGRESS-IP>/ → frontend (index page)
- http://<INGRESS-IP>/health.html → frontend health page
- http://<INGRESS-IP>/api/health → backend health endpoint
- http://<INGRESS-IP>/api/items → JSON list of products