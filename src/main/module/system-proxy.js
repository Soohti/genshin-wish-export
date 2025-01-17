const Registry = require('winreg')
const cp = require('child_process')

const proxyStatus = {
  started: false
}

const setMacProxy = async (enabled, ip, port) => {
  const list = cp.execSync('networksetup -listallnetworkservices').toString().split('\n');
  const devices = list.slice(1).filter(x => x.length > 0).map(x => x.trim());
  const enabledFlag = enabled ? 'on' : 'off';

  for (const i of devices) {
    try {
      if (enabled) {
        await cp.execSync(`networksetup -setwebproxy ${i} ${ip} ${port}`)
        await cp.execSync(`networksetup -setsecurewebproxy ${i} ${ip} ${port}`)
      }
      await cp.execSync(`networksetup -setwebproxystate ${i} ${enabledFlag}`)
      await cp.execSync(`networksetup -setsecurewebproxystate ${i} ${enabledFlag}`)
    } catch (e) {}
  }
}

const setWindowsProxy = async (enable, proxyIp = '', ignoreIp = '') => {
  const regKey = new Registry({
    hive: Registry.HKCU,
    key:  '\\Software\\Microsoft\\Windows\\CurrentVersion\\Internet Settings'
  })

  const regSet = function (key, type, value) {
    return new Promise((rev, rej) => {
      regKey.set(key, type, value, function (err) {
        if (err) rej(err)
        rev()
      })
    })
  }
  await regSet('ProxyEnable', Registry.REG_DWORD, enable)
  await regSet('ProxyServer', Registry.REG_SZ, proxyIp)
  await regSet('ProxyOverride', Registry.REG_SZ, ignoreIp)
}

const enableProxy = async (ip, port) => {
  if (process.platform === 'darwin') {
    await setMacProxy(true, ip, port)
  } else {
    const proxyIp = `${ip}:${port}`
    const ignoreIp = 'localhost;127.*;10.*;172.16.*;172.17.*;172.18.*;172.19.*;172.20.*;172.21.*;172.22.*;172.23.*;172.24.*;172.25.*;172.26.*;172.27.*;172.28.*;172.29.*;172.30.*;172.31.*;192.168.*;<local>'
    await setWindowsProxy('1', proxyIp, ignoreIp)
  }
  proxyStatus.started = true
}

const disableProxy = async () => {
  if (process.platform === 'darwin') {
    await setMacProxy(false)
  } else {
    await setWindowsProxy('0')
  }
  proxyStatus.started = false
}

module.exports = {
  enableProxy, disableProxy, proxyStatus
}