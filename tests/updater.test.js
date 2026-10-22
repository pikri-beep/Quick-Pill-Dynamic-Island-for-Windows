const test = require("node:test");
const assert = require("node:assert");

const {
  buildInstallScript,
  buildInstallCommand,
  escapePowerShellLiteral,
} = require("../src/services/updater");

test("updater - escapes single quotes for PowerShell literals", () => {
  assert.strictEqual(escapePowerShellLiteral("C:\\Users\\Bob's App\\setup.exe"), "C:\\Users\\Bob''s App\\setup.exe");
  assert.strictEqual(escapePowerShellLiteral(null), "");
  assert.strictEqual(escapePowerShellLiteral(undefined), "");
});

test("updater - script waits for the running app before installing", () => {
  const script = buildInstallScript({
    installerPath: "C:\\Temp\\quick-pill-update-v5.5.4.exe",
    currentPid: 4242,
    appExePath: "C:\\Users\\me\\AppData\\Local\\Programs\\quick-pill\\Quick Pill.exe",
    logPath: "C:\\Users\\me\\AppData\\Roaming\\Quick Pill\\quick-pill.log",
  });

  assert.ok(script.includes("Get-Process -Id 4242"), "must wait for the running process");
  assert.ok(script.includes("quick-pill-update-v5.5.4.exe"), "must run the downloaded installer");
  assert.ok(script.includes("'-ArgumentList '/S''") || script.includes("-ArgumentList '/S'"), "must install silently");
  assert.ok(script.includes("Quick Pill.exe"), "must relaunch the installed app");
  assert.ok(script.includes("audio-helper"), "must release the audio helper lock");
});

test("updater - script never installs before the app process is gone", () => {
  const script = buildInstallScript({
    installerPath: "C:\\Temp\\setup.exe",
    currentPid: 777,
  });

  const waitIndex = script.indexOf("Get-Process -Id 777");
  const installIndex = script.indexOf("Start-Process -FilePath 'C:\\Temp\\setup.exe'");
  assert.ok(waitIndex >= 0 && installIndex > waitIndex, "the wait must come before the install");
});

test("updater - kills leftover app processes that lock the install folder", () => {
  const script = buildInstallScript({ installerPath: "C:\\Temp\\setup.exe", currentPid: 1 });
  assert.ok(script.includes("Get-Process -Name 'Quick Pill'"));
  assert.ok(script.includes("Get-Process -Name 'quick-pill'"));
  assert.ok(script.includes("Get-Process -Name 'audio-helper'"));
});

test("updater - escapes the installer path so it cannot break out of the literal", () => {
  const script = buildInstallScript({
    installerPath: "C:\\Temp\\it's-broken.exe",
    currentPid: 5,
  });
  assert.ok(script.includes("it''s-broken.exe"));
  assert.ok(!script.includes("'C:\\Temp\\it's-broken.exe'"));
});

test("updater - command targets powershell with a hidden window", () => {
  const cmd = buildInstallCommand({ installerPath: "C:\\Temp\\setup.exe", currentPid: 9 });
  assert.strictEqual(cmd.command, "powershell.exe");
  assert.ok(cmd.args.includes("-NoProfile"));
  assert.ok(cmd.args.includes("-WindowStyle"));
  assert.ok(cmd.args.includes("Hidden"));
  assert.strictEqual(cmd.args[cmd.args.length - 1], cmd.script);
});

test("updater - requires an installer path", () => {
  assert.throws(() => buildInstallScript({}), /installerPath/);
});
