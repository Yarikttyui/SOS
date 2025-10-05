from pathlib import Path

ROOT = Path(__file__).resolve().parent
EXCLUDE_DIRS = {'.git', '__pycache__', 'node_modules', '.mypy_cache', '.pytest_cache', 'dist', 'build', '.venv', 'venv', '.idea', '.vscode', '.azure'}
EXTENSIONS = {'.py', '.ts', '.tsx', '.js', '.jsx'}


def should_skip(path: Path) -> bool:
    return any(part in EXCLUDE_DIRS for part in path.parts)


def process_file(file_path: Path) -> bool:
    text = file_path.read_text(encoding='utf-8')
    lines = text.splitlines()
    new_lines = []
    changed = False

    for line in lines:
        stripped = line.lstrip()
        if not stripped:
            new_lines.append(line)
            continue

        suffix = file_path.suffix.lower()
        if suffix == '.py':
            if stripped.startswith('#'):
                changed = True
                continue
        elif suffix in {'.ts', '.tsx', '.js', '.jsx'}:
            if stripped.startswith('//'):
                changed = True
                continue

        new_lines.append(line)

    if changed:
        file_path.write_text('\n'.join(new_lines) + ('\n' if text.endswith('\n') else ''), encoding='utf-8')

    return changed


def main():
    changed_files = []
    for file_path in ROOT.rglob('*'):
        if file_path.suffix.lower() not in EXTENSIONS:
            continue
        if should_skip(file_path):
            continue
        if process_file(file_path):
            changed_files.append(file_path.relative_to(ROOT))

    print(f"Processed {len(changed_files)} files with removed comment lines.")
    for path in changed_files:
        print(path)


if __name__ == '__main__':
    main()
