# k8s-shop-project
source code for project report Container Orchestration

## Startup

This project runs on an Amazon EKS cluster using private container images from GitHub Container Registry (GHCR). The following steps describe the recommended order for bootstrapping the environment. 

### 1. Create the EKS cluster
The Kubernetes cluster is created using an `eksctl` ClusterConfig.
`` eksctl create cluster -f cluster.yaml``
The `cluster.yaml` file defines the cluster name, region, Kubernetes version, node group configuration and installation of the AWS EBS CSI driver for persistent storage management.

### 2. Proviosion the default gp3 StorageClass
For persistent volumes, a custom StorageClass based on Amauon EBS gp3 is provided and marked as the default StorageClass.
` kubectl apply -f gp3-storageclass.yaml``
The `gp3` StorageClass ensures that PVCs withour and explicit SitrageClass automatically receive gp3-backend volumes.

### 3. Deploy database components
First, create the Secret and configuration for the MySQL database, then deploy the database resources. For simplicity reasons a `mysql-secret.yaml` is provided and can be applied. In a real world scenario this approach shouldn´t be chossen and a kubernetes secret should be created and referenced in the Deployments.
`` kubectl apply -f mysql-secret.yaml``
`` kubectl apply -f database.yaml``
The database uses PVCs based on the previously created `gp3` StorageClass and exposes an internal service `shop-database-service` for other services in the cluster.

### 4. Create the image pull secret for GHCR
The frontend and backend container images are stored in GitHub Container Registry (`hcr.io`) and are private. An image pull secret based on a GitHub Personal Access Token (PAT) with at least the `read:packages` scope is required.
``kubectl create secret docker-registry ghcr-auth \
  --docker-server=https://ghcr.io \
  --docker-username=<GITHUB_USERNAME> \
  --docker-password=<GITHUB_PAT> \
  --docker-email=<YOUR_EMAIL>``
The ghcr-auth secret is referencesd in the Deployments via the imagagePullSecrets section so that Kubernetes can pull the private images from GHCR.

### 5. Deploy the backend
Once the database and image pull secret are available, the backend can be deployed. 
`` kubectl apply -f backend.yaml``
The backend Deployment uses environment variables for database host, user, databasename and the the password via the mysql-secret. It is exposed through the internal service shop-backend-service inside the cluster.

### 6. Deploy the fronend
Finally, deploy the frontend, which runs as a single-page application inside the cluster. 
`` kubectl apply -f frontend.yaml``
The frontend Deployment is exposed externally via the shop-frontend-service of type Loadbalancer. The application calls the backend inside the cluster using the service name, so no external DNS names are required for internal communication.