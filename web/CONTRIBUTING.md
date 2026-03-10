
# Contributing to Artificial World

First off, thank you for considering contributing to Artificial World! It's people like you that make Artificial World such a great tool for the community.

## Code of Conduct
By participating in this project, you are expected to uphold our Code of Conduct. Please be respectful, welcoming, and inclusive to all community members.

## How to Contribute

### Report Bugs
If you find a bug, please open an issue on GitHub using the Bug Report template. Include:
- A clear and descriptive title.
- Steps to reproduce the behavior.
- Expected vs actual behavior.
- Screenshots or console logs if applicable.
- Your environment (Browser, OS, Device).

### Request Features
Have an idea for a new feature? Open an issue using the Feature Request template. Include:
- A clear description of the feature.
- The problem it solves or the value it adds.
- Potential implementation ideas if you have them.

### Submit Code Changes
1. **Fork the repository** and create your branch from `main`.
2. **Clone your fork** locally.
3. **Install dependencies** with `npm install`.
4. **Make your changes** and test them locally.
5. **Commit your changes** following our commit message guidelines.
6. **Push to your fork** and submit a Pull Request to the `main` branch.

## Code Style Guidelines

### JavaScript / React
- Use ES6+ syntax (arrow functions, destructuring, etc.).
- Use functional components and React Hooks.
- Keep components small and focused (under 300-400 lines).
- Use absolute imports (`@/components/...`).
- Always include `.jsx` or `.js` extensions in imports.

### CSS / Tailwind
- Use Tailwind CSS utility classes for styling.
- Avoid custom CSS unless absolutely necessary (place in `index.css`).
- Use CSS variables defined in `index.css` for colors to support dark/light modes.

### File Organization
- `src/components/`: Reusable UI components.
- `src/pages/`: Route-level page components.
- `src/lib/`: Utility functions and helpers.

## Testing
- **Manual Testing:** Ensure your changes work across different screen sizes (mobile, tablet, desktop) and browsers (Chrome, Firefox, Safari).
- **Automated Testing:** Currently, the project does not use automated testing frameworks. Please thoroughly test your changes manually before submitting a PR.

## Documentation
If you add a new feature, please update the relevant documentation (e.g., `README.md`, `USER_GUIDE.md`).

## Commit Message Guidelines
We follow conventional commits:
- `feat:` A new feature
- `fix:` A bug fix
- `docs:` Documentation only changes
- `style:` Changes that do not affect the meaning of the code (formatting, etc.)
- `refactor:` A code change that neither fixes a bug nor adds a feature
- `perf:` A code change that improves performance
- `chore:` Changes to the build process or auxiliary tools

*Example:* `feat: add multiplayer support to Tic-Tac-Toe`

## Pull Request Process
1. Ensure your code follows the style guidelines.
2. Update documentation if necessary.
3. Describe your changes in detail in the PR description.
4. Link any relevant issues.
5. Wait for a maintainer to review your PR.

## Review Process
Maintainers will review your PR and may request changes. Once approved, a maintainer will merge it into `main`.

## Areas for Contribution
- **Games Arena:** Adding new games (e.g., Chess).
- **Simulation:** Improving the deterministic engine or adding new agent behaviors.
- **UI/UX:** Enhancing the design, animations, or accessibility.
- **Documentation:** Translating docs or improving existing guides.

## Development Setup
### Prerequisites
- Node.js (v20+)
- Git

### Commands
