# The One Playlist

Play all your favorite media content from YouTube and Spotify in a single combined playlist.

Platform specific content will now be a thing of the past.

## Visit the site

- [https://www.theoneplaylist.com/](https://www.theoneplaylist.com/)

## Packages

- ### <img src="https://nestjs.com/img/logo-small.svg" width="50" align="center" alt="Nest Logo" /> Server

  - Package Link: [./packages/server](./packages/server)
  - README Link: [./packages/server/README.md](./packages/server/README.md)
<!-- Comment used for spacing -->
- ### <img src="https://camo.githubusercontent.com/92ec9eb7eeab7db4f5919e3205918918c42e6772562afb4112a2909c1aaaa875/68747470733a2f2f6173736574732e76657263656c2e636f6d2f696d6167652f75706c6f61642f76313630373535343338352f7265706f7369746f726965732f6e6578742d6a732f6e6578742d6c6f676f2e706e67" width="50" align="center" alt="Next.js Logo" /> Web

  - Package Link: [./packages/web](./packages/web)
  - README Link: [./packages/web/README.md](./packages/web/README.md)

## Scripts

- ### Installing dependencies on all packages

  ```bash
  $ yarn run install:all
  ```

- ### Running ESLint on all packages

  ```bash
  # basic
  $ yarn run lint

  # run and fix all errors
  $ yarn run lint:fix
  ```

- ### Running tests on all packages

  ```bash
  # unit tests
  $ yarn run test

  # integration tests
  $ yarn run test:int

  # e2e tests
  $ yarn run test:e2e

  # all tests
  $ yarn run test:all

  # test coverage
  $ yarn run test:cov[:int|:e2e|:all]
  ```

## Recommended VSCode Extensions

- ### <img src="https://dbaeumer.gallerycdn.vsassets.io/extensions/dbaeumer/vscode-eslint/2.2.6/1657015175302/Microsoft.VisualStudio.Services.Icons.Default" width="50" align="center" alt="ESLint Logo" /> ESLint

  - Integrates ESLint into VS Code
    - Extension Link: [vscode:extension/dbaeumer.vscode-eslint](vscode:extension/dbaeumer.vscode-eslint)
    - Website Link: [https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint)
<!-- Comment used for spacing -->
- ### <img src="https://prisma.gallerycdn.vsassets.io/extensions/prisma/prisma/4.1.0/1658235313259/Microsoft.VisualStudio.Services.Icons.Default" width="50" align="center" alt="Prisma Logo" /> Prisma

  - Adds syntax highlighting, linting, code completion, formatting, jump-to-definition and more for Prisma Schema files
    - Extension Link: [vscode:extension/Prisma.prisma](vscode:extension/Prisma.prisma)
    - Website Link: [https://marketplace.visualstudio.com/items?itemName=Prisma.prisma](https://marketplace.visualstudio.com/items?itemName=Prisma.prisma)
<!-- Comment used for spacing -->
- ### <img src="https://formulahendry.gallerycdn.vsassets.io/extensions/formulahendry/auto-rename-tag/0.1.10/1644319230173/Microsoft.VisualStudio.Services.Icons.Default" width="50" align="center" alt="Auto Rename Tag Logo" /> Auto Rename Tag

  - Automatically rename paired HTML/XML tag, same as Visual Studio IDE does
    - Extension Link: [vscode:extension/formulahendry.auto-rename-tag](vscode:extension/formulahendry.auto-rename-tag)
    - Website Link: [https://marketplace.visualstudio.com/items?itemName=formulahendry.auto-rename-tag](https://marketplace.visualstudio.com/items?itemName=formulahendry.auto-rename-tag)
