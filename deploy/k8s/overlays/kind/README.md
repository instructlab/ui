# Introduction

Kind is a tool that can allow you to emulate a local kuberenetes cluster. These manifests will help you provision a correctly configured kind cluster and apply the resources.

# Usage

## Building the cluster

You can either create a default cluster, or use the setup we have to mimic our openshift dpeloyment more closely: `kind create cluster --config kind.yaml`.

## Applying the kind-ingress manifests

If you dont care about using an ingress and choose to hit the services directly, use host networking on your container runtime on which you are using kind, or some other
edge case which would remove the necesity of ingresses, you can simple ignore the [kind-ingress.yaml](./kind-ingress.yaml). However if you do want to use ingresses 
(which are a part of both the default UI stack and the umami metrics stack), then you should deploy the kind ingress: `kubectl create -f kind-ingress.yaml`.
This will take some time to deploy, so now we can simply wait for it:
```bash
kubectl wait --namespace ingress-nginx \
  --for=condition=ready pod \
  --selector=app.kubernetes.io/component=controller \
  --timeout=90s
```

Once this goes through, you should review a message similar to the following letting you know you can proceed:
`pod/ingress-nginx-controller-68c4c94464-jvnjf condition met`.
