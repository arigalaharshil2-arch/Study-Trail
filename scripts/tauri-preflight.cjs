const fs = require('fs');
const path = require('path');

console.log('=== Running Tauri Packaging Preflight Check ===');

// 1. Check tauri.conf.json
const tauriConfPath = path.join(__dirname, '..', 'src-tauri', 'tauri.conf.json');
if (!fs.existsSync(tauriConfPath)) {
  console.error('FAIL: src-tauri/tauri.conf.json not found!');
  process.exit(1);
}

let tauriConf;
try {
  const content = fs.readFileSync(tauriConfPath, 'utf8');
  tauriConf = JSON.parse(content);
  console.log('✓ tauri.conf.json is valid JSON');
} catch (err) {
  console.error('FAIL: Failed to parse tauri.conf.json:', err.message);
  process.exit(1);
}

// 2. Check product details & bundle config
const productName = tauriConf.productName;
const version = tauriConf.version;
const identifier = tauriConf.identifier;
console.log(`✓ Product: "${productName}" v${version} (${identifier})`);

if (!productName || !version || !identifier) {
  console.error('FAIL: Missing required tauri.conf.json metadata (productName, version, or identifier)');
  process.exit(1);
}

// 3. Check icon references in bundle
const bundleIcons = tauriConf.bundle?.icon || [];
if (bundleIcons.length === 0) {
  console.error('FAIL: No bundle icons configured in tauri.conf.json');
  process.exit(1);
}

for (const iconRel of bundleIcons) {
  const iconPath = path.join(__dirname, '..', 'src-tauri', iconRel);
  if (!fs.existsSync(iconPath)) {
    console.error(`FAIL: Referenced icon file missing: ${iconPath}`);
    process.exit(1);
  }
  const stat = fs.statSync(iconPath);
  if (stat.size === 0) {
    console.error(`FAIL: Icon file is zero bytes: ${iconPath}`);
    process.exit(1);
  }
  console.log(`✓ Icon present: ${iconRel} (${stat.size} bytes)`);
}

// 4. Detailed validation of icon.ico
const icoPath = path.join(__dirname, '..', 'src-tauri', 'icons', 'icon.ico');
if (!fs.existsSync(icoPath)) {
  console.error('FAIL: src-tauri/icons/icon.ico does not exist!');
  process.exit(1);
}

const icoBuffer = fs.readFileSync(icoPath);
if (icoBuffer.length < 6) {
  console.error('FAIL: icon.ico is too small to be a valid ICO file');
  process.exit(1);
}

const reserved = icoBuffer.readUInt16LE(0);
const iconType = icoBuffer.readUInt16LE(2); // 1 = ICO
const imageCount = icoBuffer.readUInt16LE(4);

if (reserved !== 0 || iconType !== 1 || imageCount === 0) {
  console.error(`FAIL: Invalid ICO header (reserved=${reserved}, type=${iconType}, count=${imageCount})`);
  process.exit(1);
}

console.log(`✓ icon.ico is a valid ICO container with ${imageCount} frame(s)`);

for (let i = 0; i < imageCount; i++) {
  const offset = 6 + i * 16;
  if (offset + 16 > icoBuffer.length) {
    console.error(`FAIL: Corrupted ICO entry directory at index ${i}`);
    process.exit(1);
  }
  let w = icoBuffer.readUInt8(offset);
  let h = icoBuffer.readUInt8(offset + 1);
  if (w === 0) w = 256;
  if (h === 0) h = 256;
  const bpp = icoBuffer.readUInt16LE(offset + 6);
  const dataSize = icoBuffer.readUInt32LE(offset + 8);
  const dataOffset = icoBuffer.readUInt32LE(offset + 12);

  if (dataOffset + dataSize > icoBuffer.length) {
    console.error(`FAIL: ICO entry ${i} data exceeds file size`);
    process.exit(1);
  }

  const frameData = icoBuffer.slice(dataOffset, dataOffset + dataSize);
  const isPng = frameData.length >= 8 && frameData.slice(0, 8).toString('hex') === '89504e470d0a1a0a';

  if (isPng && w < 256) {
    console.error(`FAIL: icon.ico frame ${w}x${h} uses PNG encoding! Windows rc.exe requires DIB for sub-256x256 frames (causes RC2176 error).`);
    process.exit(1);
  }

  if (!isPng) {
    const headerSize = frameData.readUInt32LE(0);
    if (headerSize !== 40) {
      console.error(`FAIL: icon.ico frame ${w}x${h} uses non-standard DIB header size ${headerSize} (rc.exe requires BITMAPINFOHEADER 40 bytes)`);
      process.exit(1);
    }
  }

  console.log(`  - Frame ${i}: ${w}x${h}, bpp=${bpp}, format=${isPng ? 'PNG (256x256 ok)' : 'DIB BITMAPINFOHEADER (40B ok)'}`);
}

// 5. Check Cargo.toml and capabilities
const cargoPath = path.join(__dirname, '..', 'src-tauri', 'Cargo.toml');
if (!fs.existsSync(cargoPath)) {
  console.error('FAIL: src-tauri/Cargo.toml missing!');
  process.exit(1);
}

const capPath = path.join(__dirname, '..', 'src-tauri', 'capabilities', 'default.json');
if (!fs.existsSync(capPath)) {
  console.error('FAIL: src-tauri/capabilities/default.json missing!');
  process.exit(1);
}

const capContent = JSON.parse(fs.readFileSync(capPath, 'utf8'));
const permissions = capContent.permissions || [];
const invalidPerms = permissions.filter(p => p === 'fs:allow-read-text' || p === 'fs:allow-write-text');
if (invalidPerms.length > 0) {
  console.error('FAIL: Obsolete capabilities found in default.json:', invalidPerms);
  process.exit(1);
}

console.log('✓ Capabilities verified: No obsolete permissions found');
console.log('=== Preflight Check PASSED Successfully! ===');
