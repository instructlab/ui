# InstructLab UI stack deployment in Podman

InstructLab UI provides a simple and intuitive web interface that users can use to create knowledge and skill contribution. InstructLab UI supports two mode of deployments:

## Github mode

Github mode is used to deploy the UI stack with Github integration. Users can create skill and knowledge contributions and push it to the taxonomy repository present in instructlab org or their own personal clone of the taxonomy repository present under the user's own organization. To deploy InstructLab UI stack in the Github mode on Podman, please follow the detailed instructions present [here](./github/README.md).

## Native mode

Native mode is used to deploy the InstructLab UI stack without Github integration. User created skill and knowledge contributions are local to the machine where UI stack is deployed. Users can publish their contribution to any taxonomy repository present on the machine for synthetic data generation or training of the model using the [InstructLab tools](https://github.com/instructlab/instructlab). To deploy the InstructLab UI stack in Native mode, please follow the detailed instructions present [here](./native/README.md).
