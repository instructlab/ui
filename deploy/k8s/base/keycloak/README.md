# Deployment guide

## Keycloak setup

These are stock out of the box rhsso + keycloak deployments that will work with the instructlab-ui as its OIDC provider.
To apply these manifests, first apply the `operator`, wait for the rhsso operator to come online, and then proceed to
apply the `resources`.

```bash

oc --kustomize apply operator/
### wait for keycloak, keycloak-psql and rhsso pods to come up

oc get pods -n keycloak-system
# expect:
# NAME                                   READY   STATUS    RESTARTS   AGE
# keycloak-0                             1/1     Running   0          32h
# keycloak-postgresql-5965b4dd55-22hsc   1/1     Running   0          11d
# rhsso-operator-758844f657-s97k9        1/1     Running   0          32h

oc --kustomize apply resources/
# This will create the Keycloak instance, KeycloakClient, KeycloakRealm, and a dummy user
```

## Application setup

Now, we need to setup our `.env` file so that we can use the resources we just created to authenticate. 
We need to set the following values: `KEYCLOAK_CLIENT_ID`, `KEYCLOAK_CLIENT_SECRET`, and `KEYCLOAK_ISSUER`.
To get these values you can do the following (this assumes no modification to the manifests):

```bash
export KEYCLOAK_CLIENT_ID=$(kubectl get secret keycloak-client-secret-instructlab-ui -n keycloak-system -o yaml | yq .data.CLIENT_ID | base64 -d)
export KEYCLOAK_CLIENT_SECRET=$(kubectl get secret keycloak-client-secret-instructlab-ui -n keycloak-system -o yaml | yq .data.CLIENT_SECRET | base64 -d)
export KEYCLOAK_ISSUER=$(kubectl get keycloak keycloak -n keycloak-system -o jsonpath='{.status.externalURL}')/auth/realms/instructlab-ui
```

Additionally, make sure the `IL_UI_DEPLOYMENT=dev` value is set in the `.env` file, because keycloak auth is not currently available
in the production deployment. After this you can build and run the application however you like. When you go to sign in, make sure
to use the credentials you specificed in the [user manifest](/resources/user.yaml), credentials to the admin console will not work

