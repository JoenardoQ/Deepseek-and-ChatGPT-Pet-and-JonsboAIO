import path from "node:path";
import { spawnSync } from "node:child_process";

// Windows Server's native tar can crash on this Unicode media tree. Python's
// standard-library tarfile keeps packaging independent of the runner's tar build.
function archive(operation, file, directory = "") {
  const python =
    process.env.PET_BUILD_PYTHON || process.env.PET_PYTHON || "python";
  const code = `
import json, pathlib, sys, tarfile
operation, file, directory = sys.argv[1:]
with tarfile.open(file, 'w:gz' if operation == 'create' else 'r:gz') as bundle:
    if operation == 'create':
        bundle.add(directory, arcname=pathlib.Path(directory).name)
    elif operation == 'list':
        print(json.dumps(bundle.getnames(), ensure_ascii=False))
    elif operation == 'extract':
        bundle.extractall(directory, filter='data')
`;
  const result = spawnSync(
    python,
    ["-X", "utf8", "-c", code, operation, path.resolve(file), directory],
    {
      windowsHide: true,
      encoding: "utf8",
      timeout: 120000,
    },
  );
  if (result.status !== 0)
    throw Error(
      `Archive ${operation} failed (${python}): ${result.error?.message || result.stderr || result.status}. Set PET_BUILD_PYTHON to Python 3.12+ if needed.`,
    );
  return result.stdout;
}
export const createTarGzip = (file, directory) =>
  archive("create", file, path.resolve(directory));
export const listTarGzip = (file) => JSON.parse(archive("list", file));
export const extractTarGzip = (file, directory) =>
  archive("extract", file, path.resolve(directory));
