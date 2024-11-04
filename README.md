# InstructLab UI

![Lint](https://github.com/instructlab/ui/actions/workflows/lint-ui.yml/badge.svg?branch=main)
![Image](https://github.com/instructlab/ui/actions/workflows/images.yml/badge.svg?branch=main)

Project aims to provide a UI based interface to the contributors and reviewers to submit and review contribution to [instructlab/taxonomy](https://github.com/instructlab/taxonomy).
The intention is to simplify the process of contribution by providing a user friendly interface, that doesn't require the user to have a deep understanding of tools required to contribute skill and knowledge to the taxonomy. This project also aims to provide a platform for the reviewers to efficiently review the contributions and provide feedback to the contributors.

## Overview

Current scope of the project is to work on following personas:

- Taxonomy **Contributor**: Person who wants to contribute a skill or a knowledge to the taxonomy.
- Taxonomy **Triager**: Person who has expertise to review the contributions and provide feedback to the contributors.

The technical overview and developer docs for getting started can be found [here](docs/development.md).

## Contributing

If you have suggestions for how instructlab/ui could be improved, or want to
report a bug, open an [issue](https://github.com/instructlab/ui/issues)! We'd love all and any contributions.

For more, check out the [InstructLab UI Contribution Guide](CONTRIBUTING.md)
and [InstructLab Community Guide](https://github.com/instructlab/community/blob/main/CONTRIBUTING.md).

## Updating the Sealed Secrets

To update the sealed secret, you must communicate with the controller that lives in the `kube-system` namespace of the qa cluster.
After signing in to the cluster, you can re-writing the secret file that you want to seal. Then you simply `cat` the secret file,
and pipe that to the `kubeseal` binary as follows:

```bash
cat <secret_file> | kubeseal \
     --controller-name=sealed-secrets-controller \
     --controller-namespace=kube-system \
     --format yaml > <sealed_secret_file>
```

This will generate the new encrypted sealed-secret manifest in the file you specified with `<sealed_secret_file>`. After this please
BE CERTAIN to delete the un-encrypted secret file, we do not want to leak these values in `git`. Finally you can move the `sealed-secret`
to its correct location within this repo.

### Common issues

- `error: cannot get sealed secret service: Unauthorized`: You must be signed in to the qa cluster to be able to communicate with the sealed secrets controller.

## Community Meeting

We have a weekly community meeting to discuss the project and contributions. Meeting happens **every Wednesday 10AM PST**.
Please subscribe to the InstructLab Community Calendar following the instructions [here](https://github.com/instructlab/community/blob/main/Collaboration.md). UI project meeting details are present in the calendar event.

## Slack channel

Please subscribe to the InstructLab Slack workspace by following the instructions [here](https://github.com/instructlab/community/blob/main/Collaboration.md#chat). Once you are part of the workspace, you can join the `#ui` channel where most of the project related topics are discussed.

## License

[Apache 2.0](LICENSE)
