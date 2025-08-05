# 🚀 Guía de Despliegue - Backend y Frontend con Kubernetes

Esta guía explica cómo estructurar correctamente el despliegue de una aplicación full-stack (backend Python + frontend React) usando Kubernetes y Jenkins.

## 📁 Estructura de Archivos Sugerida

```
DockerApp/
├── deploy/
│   ├── backend-deployment.yaml
│   ├── backend-service.yaml
│   ├── frontend-deployment.yaml
│   ├── frontend-service.yaml
│   └── ingress.yaml
├── docker/
│   ├── Dockerfile.backend
│   ├── Dockerfile.frontend
│   └── nginx.conf
├── requirements.txt
├── users.py
├── src/
├── package.json
├── Jenkinsfile
└── DEPLOYMENT_GUIDE.md (este archivo)
```

## 🐳 Dockerfiles

### `docker/Dockerfile.backend`

```dockerfile
FROM python:3.9-slim

WORKDIR /app

# Instalar dependencias del sistema
RUN apt-get update && apt-get install -y \
    gcc \
    default-libmysqlclient-dev \
    pkg-config \
    && rm -rf /var/lib/apt/lists/*

# Copiar e instalar dependencias de Python
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copiar código fuente
COPY users.py .

# Exponer puerto
EXPOSE 5000

# Comando de inicio
CMD ["python", "users.py"]
```

### `docker/Dockerfile.frontend`

```dockerfile
# Etapa de construcción
FROM node:18-alpine as build

WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./
RUN npm ci --only=production

# Copiar código fuente y construir
COPY . .
RUN npm run build

# Etapa de producción
FROM nginx:alpine

# Copiar archivos construidos
COPY --from=build /app/dist /usr/share/nginx/html

# Copiar configuración de nginx
COPY docker/nginx.conf /etc/nginx/nginx.conf

# Exponer puerto
EXPOSE 80

# Comando de inicio
CMD ["nginx", "-g", "daemon off;"]
```

### `docker/nginx.conf`

```nginx
events {
    worker_connections 1024;
}

http {
    include       /etc/nginx/mime.types;
    default_type  application/octet-stream;

    sendfile        on;
    keepalive_timeout  65;

    server {
        listen       80;
        server_name  localhost;

        root   /usr/share/nginx/html;
        index  index.html index.htm;

        # Manejo de rutas de React (SPA)
        location / {
            try_files $uri $uri/ /index.html;
        }

        # Headers de seguridad
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-XSS-Protection "1; mode=block" always;
        add_header X-Content-Type-Options "nosniff" always;

        # Cacheo de archivos estáticos
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }
}
```

## 📦 Dependencias Python

### `requirements.txt`

```txt
Flask==2.3.3
Flask-CORS==4.0.0
SQLAlchemy==2.0.21
PyMySQL==1.1.0
python-dotenv==1.0.0
gunicorn==21.2.0
```

## ☸️ Archivos de Kubernetes

### `deploy/backend-deployment.yaml`

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: backend-app
  labels:
    app: backend-app
    tier: backend
spec:
  replicas: 2
  selector:
    matchLabels:
      app: backend-app
      tier: backend
  template:
    metadata:
      labels:
        app: backend-app
        tier: backend
    spec:
      containers:
        - name: backend-app
          image: 10.83.64.110:8085/backend-app:latest
          ports:
            - containerPort: 5000
              name: http
          env:
            - name: DATABASE_URL
              value: "mysql://user:password@mysql-service:3306/mydb"
            - name: FLASK_ENV
              value: "production"
            - name: CORS_ORIGIN
              value: "http://miapp.local"
          resources:
            requests:
              memory: "128Mi"
              cpu: "100m"
            limits:
              memory: "256Mi"
              cpu: "200m"
          livenessProbe:
            httpGet:
              path: /health
              port: 5000
            initialDelaySeconds: 30
            periodSeconds: 10
          readinessProbe:
            httpGet:
              path: /ready
              port: 5000
            initialDelaySeconds: 5
            periodSeconds: 5
```

### `deploy/backend-service.yaml`

```yaml
apiVersion: v1
kind: Service
metadata:
  name: backend-service
  labels:
    app: backend-app
    tier: backend
spec:
  selector:
    app: backend-app
    tier: backend
  ports:
    - name: http
      port: 5000
      targetPort: 5000
      protocol: TCP
  type: ClusterIP
```

### `deploy/frontend-deployment.yaml`

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: frontend-app
  labels:
    app: frontend-app
    tier: frontend
spec:
  replicas: 2
  selector:
    matchLabels:
      app: frontend-app
      tier: frontend
  template:
    metadata:
      labels:
        app: frontend-app
        tier: frontend
    spec:
      containers:
        - name: frontend-app
          image: 10.83.64.110:8085/frontend-app:latest
          ports:
            - containerPort: 80
              name: http
          env:
            - name: REACT_APP_API_URL
              value: "http://miapp.local/api"
          resources:
            requests:
              memory: "64Mi"
              cpu: "50m"
            limits:
              memory: "128Mi"
              cpu: "100m"
          livenessProbe:
            httpGet:
              path: /
              port: 80
            initialDelaySeconds: 10
            periodSeconds: 30
          readinessProbe:
            httpGet:
              path: /
              port: 80
            initialDelaySeconds: 5
            periodSeconds: 10
```

### `deploy/frontend-service.yaml`

```yaml
apiVersion: v1
kind: Service
metadata:
  name: frontend-service
  labels:
    app: frontend-app
    tier: frontend
spec:
  selector:
    app: frontend-app
    tier: frontend
  ports:
    - name: http
      port: 80
      targetPort: 80
      protocol: TCP
  type: ClusterIP
```

### `deploy/ingress.yaml`

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: mi-app-ingress
  annotations:
    nginx.ingress.kubernetes.io/rewrite-target: /$2
    nginx.ingress.kubernetes.io/use-regex: "true"
    nginx.ingress.kubernetes.io/cors-allow-origin: "*"
    nginx.ingress.kubernetes.io/cors-allow-methods: "GET, POST, PUT, DELETE, OPTIONS"
    nginx.ingress.kubernetes.io/cors-allow-headers: "Content-Type, Authorization"
spec:
  ingressClassName: nginx
  rules:
    - host: miapp.local
      http:
        paths:
          # Rutas del backend (API)
          - path: /api(/|$)(.*)
            pathType: Prefix
            backend:
              service:
                name: backend-service
                port:
                  number: 5000
          # Rutas del frontend (React)
          - path: /()(.*)
            pathType: Prefix
            backend:
              service:
                name: frontend-service
                port:
                  number: 80
```

## 🔧 Pipeline de Jenkins

### `Jenkinsfile`

```groovy
pipeline {
  agent any
 
  environment {
    GIT_CREDENTIALS_ID = "git-credentials"
    REPO_URL = "http://172.28.176.1:8084/root/emmanuel.git"
    BRANCH_NAME = "main"
    KUBECONFIG = "${WORKSPACE}/.kube/config"
    REGISTRY = "10.83.64.110:8085"
    BACKEND_IMAGE = "${REGISTRY}/backend-app"
    FRONTEND_IMAGE = "${REGISTRY}/frontend-app"
    BUILD_NUMBER = "${env.BUILD_NUMBER}"
  }
 
  stages {
    stage('Cleanup Workspace') {
      steps {
        cleanWs()
      }
    }

    stage('Cloning Repository') {
      steps {
        git branch: "${BRANCH_NAME}", 
            credentialsId: "${GIT_CREDENTIALS_ID}", 
            url: "${REPO_URL}"
      }
    }
    
    stage('Build Docker Images') {
      parallel {
        stage('Build Backend Image') {
          steps {
            script {
              def backendImage = docker.build("${BACKEND_IMAGE}:${BUILD_NUMBER}", "-f docker/Dockerfile.backend .")
              docker.withRegistry("http://${REGISTRY}") {
                backendImage.push()
                backendImage.push("latest")
              }
            }
          }
        }
        stage('Build Frontend Image') {
          steps {
            script {
              def frontendImage = docker.build("${FRONTEND_IMAGE}:${BUILD_NUMBER}", "-f docker/Dockerfile.frontend .")
              docker.withRegistry("http://${REGISTRY}") {
                frontendImage.push()
                frontendImage.push("latest")
              }
            }
          }
        }
      }
    }
    
    stage('Setup Kubernetes Config') {
      steps {
        sh 'mkdir -p $WORKSPACE/.kube && chmod 700 $WORKSPACE/.kube'
        sh 'rm -f $WORKSPACE/.kube/config'
        withCredentials([file(credentialsId: 'rancher-kubeconfig', variable: 'KUBECONFIG_FILE')]) {
          sh 'cp $KUBECONFIG_FILE $WORKSPACE/.kube/config'
          sh 'chmod 600 $WORKSPACE/.kube/config'
        }
      }
    }
 
    stage('Deploy to Kubernetes') {
      steps {
        sh 'kubectl config current-context'
        sh 'kubectl get nodes'
        
        // Aplicar configuraciones
        sh 'kubectl apply -f ./deploy/'
        
        // Actualizar imágenes con la nueva versión
        sh "kubectl set image deployment/backend-app backend-app=${BACKEND_IMAGE}:${BUILD_NUMBER}"
        sh "kubectl set image deployment/frontend-app frontend-app=${FRONTEND_IMAGE}:${BUILD_NUMBER}"
        
        // Esperar a que los deployments estén listos
        sh 'kubectl rollout status deployment/backend-app --timeout=300s'
        sh 'kubectl rollout status deployment/frontend-app --timeout=300s'
        
        // Verificar el estado
        sh 'kubectl get pods -l app=backend-app'
        sh 'kubectl get pods -l app=frontend-app'
        sh 'kubectl get svc'
        sh 'kubectl get ingress'
      }
    }

    stage('Health Check') {
      steps {
        script {
          sleep(30) // Esperar a que los servicios estén completamente listos
          
          // Verificar que los pods estén corriendo
          sh '''
            echo "Verificando estado de los pods..."
            kubectl get pods -l app=backend-app -o wide
            kubectl get pods -l app=frontend-app -o wide
            
            # Verificar logs si hay errores
            if kubectl get pods -l app=backend-app | grep -v Running; then
              echo "Logs del backend:"
              kubectl logs -l app=backend-app --tail=50
            fi
            
            if kubectl get pods -l app=frontend-app | grep -v Running; then
              echo "Logs del frontend:"
              kubectl logs -l app=frontend-app --tail=50
            fi
          '''
        }
      }
    }
  }

  post {
    always {
      // Limpiar imágenes locales para ahorrar espacio
      sh 'docker image prune -f'
    }
    
    success {
      echo '✅ Despliegue completado exitosamente!'
      echo "🌐 Aplicación disponible en: http://miapp.local"
      echo "🔗 API disponible en: http://miapp.local/api"
    }
    
    failure {
      echo '❌ El despliegue falló. Revisa los logs para más detalles.'
      
      // Mostrar información de debug
      sh '''
        echo "=== Estado de los recursos ==="
        kubectl get all
        echo "=== Eventos recientes ==="
        kubectl get events --sort-by=.metadata.creationTimestamp
      '''
    }
  }
}
```

## 🛠️ Configuración Adicional

### Modificaciones necesarias en `users.py`

```python
from flask import Flask, jsonify, request
from flask_cors import CORS
import os

app = Flask(__name__)
CORS(app)

# Configuración de la base de datos
DATABASE_URL = os.getenv('DATABASE_URL', 'sqlite:///users.db')

# Health check endpoints
@app.route('/health')
def health():
    return jsonify({'status': 'healthy'}), 200

@app.route('/ready')
def ready():
    return jsonify({'status': 'ready'}), 200

# Tus rutas existentes aquí...

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=False)
```

### Configuración en el frontend

Actualizar `vite.config.js` para manejar la configuración de producción:

```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    host: true
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          axios: ['axios']
        }
      }
    }
  }
})
```

## 🔍 Verificación del Despliegue

### Comandos útiles para debugging:

```bash
# Verificar estado de pods
kubectl get pods -o wide

# Ver logs del backend
kubectl logs -l app=backend-app -f

# Ver logs del frontend
kubectl logs -l app=frontend-app -f

# Verificar servicios
kubectl get svc

# Verificar ingress
kubectl describe ingress mi-app-ingress

# Probar conectividad interna
kubectl run test-pod --image=busybox --rm -it --restart=Never -- sh
# Dentro del pod: wget -qO- http://backend-service:5000/health
```

### Pruebas de funcionalidad:

```bash
# Probar el frontend
curl http://miapp.local/

# Probar el backend
curl http://miapp.local/api/health

# Probar la API de usuarios
curl -X GET http://miapp.local/api/users
```

## 📝 Notas Importantes

1. **Puertos**: El backend usa el puerto 5000 y el frontend el puerto 80
2. **Rutas**: El frontend se sirve en `/` y el backend en `/api/*`
3. **Imágenes**: Se construyen y suben al registry privado `10.83.64.110:8085`
4. **Health Checks**: Implementados tanto para backend como frontend
5. **CORS**: Configurado para permitir comunicación entre servicios
6. **Recursos**: Definidos limits y requests para optimización
7. **Rolling Updates**: Configurados para despliegues sin downtime

## 🚀 Pasos para Implementar

1. Crear la estructura de carpetas sugerida
2. Copiar todos los archivos con los nombres indicados
3. Modificar `users.py` para incluir health checks
4. Actualizar las URLs y credenciales según tu entorno
5. Configurar los secrets en Jenkins
6. Ejecutar el pipeline

¡Tu aplicación estará lista para producción! 🎉




-------------------------------
i have a docker with gitlab and this project insede of it, also i have a docker with jenkins with the next script
pipeline {
  agent any
 
  environment {
    GIT_CREDENTIALS_ID = "git-credentials"
    REPO_URL = "http://172.28.176.1:8084/root/emmanuel.git"
    BRANCH_NAME = "main"
    KUBECONFIG = "${WORKSPACE}/.kube/config" // Este será usado por kubectl
  }
 
  stages {
    stage('Cloning') {
            steps {
                git branch: "${BRANCH_NAME}", credentialsId: "${GIT_CREDENTIALS_ID}", url: "${REPO_URL}"
            }
    }
    stage('kubeconfig') {
      steps {
        sh 'mkdir -p $WORKSPACE/.kube && chmod 700 $WORKSPACE/.kube'
        sh 'rm -f $WORKSPACE/.kube/config' // <-- elimina archivo anterior
        withCredentials([file(credentialsId: 'rancher-kubeconfig', variable: 'KUBECONFIG_FILE')]) {
          sh 'cp $KUBECONFIG_FILE $WORKSPACE/.kube/config'
        }
      }
    }
 
    stage('Deploy') {
      steps {
        sh 'kubectl config current-context'
        sh 'kubectl get pods'
        sh 'kubectl apply -f ./deploy'
      }
    }
  }
}
consider mi deploy folder, how would be the proper way to running the backend (users.py) and the frontend (the react app)? 