# Contributing to Journify

Thank you for your interest in contributing to **Journify**! We welcome community contributions to make Journify the most dependable, private, and distraction-free journaling app.

Please take a moment to review this guide before submitting issues or pull requests.

---

## Code of Conduct

By participating in this project, you agree to abide by our [Code of Conduct](CODE_OF_CONDUCT.md). Please treat everyone with respect and kindness.

---

## How Can I Contribute?

### 1. Reporting Bugs
- Search existing [GitHub Issues](https://github.com/LikhithSP/Journify/issues) before opening a new one to avoid duplicates.
- Clearly describe the issue, the reproduction steps, expected behavior, and actual behavior.
- Include browser/operating system environment details if relevant.

### 2. Suggesting Enhancements
- Open an issue tagged `enhancement`.
- Describe the motivation behind the suggestion and provide mockups or user workflow examples when applicable.

### 3. Submitting Pull Requests (PRs)
1. Fork the repository and create your branch from `main`:
   ```bash
   git checkout -b feature/amazing-feature
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Ensure local development works cleanly:
   ```bash
   npm run dev
   ```
4. Verify TypeScript and production builds:
   ```bash
   npm run build
   ```
5. Follow our commit message guidelines (e.g. Conventional Commits: `feat:`, `fix:`, `docs:`, `perf:`).
6. Open a Pull Request pointing to the `main` branch with a clear title and description of the changes.

---

## Development Standards

- **TypeScript**: Strict typing is enabled. Avoid `any` types wherever possible.
- **Code Style**: Follow ESLint and formatting standards present in the repository.
- **Privacy & Security**: Never log sensitive user journal content or personal authentication tokens.
- **Offline-First Resilience**: Any features altering data persistence must respect the `IndexedDB` and `SyncEngine` architecture.

---

## License

By contributing to Journify, you agree that your contributions will be licensed under the project's [MIT License](LICENSE).
