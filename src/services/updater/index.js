// @ts-check
/**
 * Quick Pill — Windows update installer helper
 *
 * The auto-updater cannot replace its own files while it is running, so the
 * install is handed over to a detached PowerShell helper that:
 *
 *   1. waits until the running Quick Pill process has exited,
 *   2. releases the file locks still held by the app (and the audio helper),
 *   3. runs the downloaded installer silently,
 *   4. relaunches the freshly installed app.
 *
 * Keeping the script generation here (instead of inline in main.js) makes it
 * unit testable — see tests/updater.test.js.
 */

/** How long the helper waits for the running app to disappear. */
const DEFAULT_WAIT_TIMEOUT_SECONDS = 120;
/** How long the helper waits for the installer process to finish. */
const DEFAULT_INSTALL_TIMEOUT_SECONDS = 900;

/**
 * Escape a value so it can be embedded in a single quoted PowerShell string.
 * @param {string} value
 * @returns {string}
 */
function escapePowerShellLiteral(value) {
  return String(value === null || value === undefined ? "" : value).replace(/'/g, "''");
}

/**
 * Build the PowerShell script that performs the silent update.
 *
 * @param {object} options
 * @param {string} options.installerPath absolute path of the downloaded installer
 * @param {number} [options.currentPid] pid of the running app (the helper waits for it)
 * @param {string} [options.appExePath] absolute path of the installed executable (relaunched afterwards)
 * @param {string} [options.logPath] optional log file the helper writes diagnostics to
 * @param {string[]} [options.processNames] processes that must be killed before installing
 * @param {number} [options.waitTimeoutSeconds]
 * @param {number} [options.installTimeoutSeconds]
 * @param {number} [options.relaunchDelayMs] grace period before the app is started again
 * @param {boolean} [options.silent] run the installer in silent mode
 * @returns {string}
 */
function buildInstallScript(options = {}) {
  const {
    installerPath,
    currentPid = 0,
    appExePath = "",
    logPath = "",
    processNames = ["audio-helper", "Quick Pill", "quick-pill"],
    waitTimeoutSeconds = DEFAULT_WAIT_TIMEOUT_SECONDS,
    installTimeoutSeconds = DEFAULT_INSTALL_TIMEOUT_SECONDS,
    relaunchDelayMs = 2500,
    silent = true,
  } = options;

  if (!installerPath) {
    throw new Error("buildInstallScript requires an installerPath");
  }

  const lines = [];

  lines.push("$ErrorActionPreference = 'SilentlyContinue'");
  lines.push("$logPath = '" + escapePowerShellLiteral(logPath) + "'");
  lines.push("$appExe = '" + escapePowerShellLiteral(appExePath) + "'");
  lines.push(
    "function Write-UpdaterLog($message) { if ($logPath -ne '') { Add-Content -Path $logPath -Value ('[' + (Get-Date -Format o) + '] [UpdaterHelper] ' + $message) } }"
  );

  // 1. Wait for the running app (this process) to disappear.
  if (Number(currentPid) > 0) {
    lines.push("Write-UpdaterLog 'waiting for Quick Pill process " + Number(currentPid) + " to exit'");
    lines.push("$deadline = (Get-Date).AddSeconds(" + Number(waitTimeoutSeconds) + ")");
    lines.push(
      "while ((Get-Date) -lt $deadline) { if (-not (Get-Process -Id " + Number(currentPid) + " -ErrorAction SilentlyContinue)) { break }; Start-Sleep -Milliseconds 300 }"
    );
  }

  // 2. Release every lock that still points into the installation folder.
  lines.push("Start-Sleep -Milliseconds 1200");
  const names = Array.isArray(processNames) ? processNames.filter(Boolean) : [];
  for (const name of names) {
    lines.push(
      "Get-Process -Name '" +
        escapePowerShellLiteral(name) +
        "' -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue"
    );
  }
  lines.push("Start-Sleep -Milliseconds 500");

  // 3. Run the installer (silently so nothing waits for user interaction).
  lines.push("Write-UpdaterLog 'starting installer: " + escapePowerShellLiteral(installerPath) + "'");
  const args = silent ? " -ArgumentList '/S'" : "";
  lines.push(
    "$installer = Start-Process -FilePath '" +
      escapePowerShellLiteral(installerPath) +
      "'" +
      args +
      " -PassThru"
  );
  lines.push("$deadline = (Get-Date).AddSeconds(" + Number(installTimeoutSeconds) + ")");
  lines.push(
    "while ((Get-Date) -lt $deadline) { if (-not (Get-Process -Id $installer.Id -ErrorAction SilentlyContinue)) { break }; Start-Sleep -Milliseconds 500 }"
  );

  // 4. Give the installer a moment to flush the new files, then relaunch.
  lines.push("Start-Sleep -Milliseconds " + Number(relaunchDelayMs));
  lines.push("if ($appExe -ne '' -and (Test-Path $appExe)) { Write-UpdaterLog 'relaunching Quick Pill'; Start-Process -FilePath $appExe }");
  lines.push("Write-UpdaterLog 'update helper finished'");

  return lines.join("; ");
}

/**
 * Build the spawn descriptor for the detached installer helper.
 *
 * @param {object} options same options as {@link buildInstallScript}
 * @returns {{ command: string, args: string[], script: string }}
 */
function buildInstallCommand(options = {}) {
  const script = buildInstallScript(options);
  return {
    command: "powershell.exe",
    args: [
      "-NoProfile",
      "-ExecutionPolicy",
      "Bypass",
      "-WindowStyle",
      "Hidden",
      "-Command",
      script,
    ],
    script,
  };
}

module.exports = {
  buildInstallScript,
  buildInstallCommand,
  escapePowerShellLiteral,
  DEFAULT_WAIT_TIMEOUT_SECONDS,
  DEFAULT_INSTALL_TIMEOUT_SECONDS,
};
