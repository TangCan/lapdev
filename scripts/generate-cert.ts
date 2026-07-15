import * as path from "https://deno.land/std@0.224.0/path/mod.ts";

const DEFAULT_CERT_DIR = path.join(Deno.cwd(), "backend", "cert");
const DEFAULT_CERT_FILE = "cert.pem";
const DEFAULT_KEY_FILE = "key.pem";

interface CertOptions {
  certDir: string;
  certFile: string;
  keyFile: string;
  commonName: string;
  validityDays: number;
}

async function generateCertificate(options: CertOptions): Promise<void> {
  const certPath = path.join(options.certDir, options.certFile);
  const keyPath = path.join(options.certDir, options.keyFile);

  await Deno.mkdir(options.certDir, { recursive: true });

  const keyCmd = new Deno.Command("openssl", {
    args: ["genrsa", "-out", keyPath, "2048"],
  });
  const keyResult = await keyCmd.output();
  if (!keyResult.success) {
    throw new Error(`Failed to generate private key: ${new TextDecoder().decode(keyResult.stderr)}`);
  }

  const csrCmd = new Deno.Command("openssl", {
    args: [
      "req", "-new", "-key", keyPath, "-out", path.join(options.certDir, "cert.csr"),
      "-subj", `/CN=${options.commonName}`,
    ],
  });
  const csrResult = await csrCmd.output();
  if (!csrResult.success) {
    throw new Error(`Failed to generate CSR: ${new TextDecoder().decode(csrResult.stderr)}`);
  }

  const extFile = path.join(options.certDir, "extfile.cnf");
  await Deno.writeTextFile(extFile, `subjectAltName=DNS:localhost,DNS:${options.commonName},IP:127.0.0.1,IP:::1
extendedKeyUsage=serverAuth
keyUsage=digitalSignature,keyEncipherment
`);

  const certCmd = new Deno.Command("openssl", {
    args: [
      "x509", "-req", "-in", path.join(options.certDir, "cert.csr"),
      "-signkey", keyPath, "-out", certPath,
      "-days", options.validityDays.toString(),
      "-extfile", extFile,
      "-sha256",
    ],
  });
  const certResult = await certCmd.output();
  if (!certResult.success) {
    throw new Error(`Failed to generate certificate: ${new TextDecoder().decode(certResult.stderr)}`);
  }

  await Deno.remove(path.join(options.certDir, "cert.csr")).catch(() => {});
  await Deno.remove(extFile).catch(() => {});

  const certStat = await Deno.stat(certPath);
  const keyStat = await Deno.stat(keyPath);

  console.log("✅ TLS 证书生成成功！");
  console.log(`   证书文件: ${certPath} (${certStat.size} 字节)`);
  console.log(`   密钥文件: ${keyPath} (${keyStat.size} 字节)`);
  console.log(`   有效期: ${options.validityDays} 天`);
  console.log(`   通用名: ${options.commonName}`);
}

async function main() {
  const args = Deno.args;
  
  let options: CertOptions = {
    certDir: DEFAULT_CERT_DIR,
    certFile: DEFAULT_CERT_FILE,
    keyFile: DEFAULT_KEY_FILE,
    commonName: "localhost",
    validityDays: 365,
  };

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case "--dir":
        options.certDir = args[++i];
        break;
      case "--cn":
        options.commonName = args[++i];
        break;
      case "--days":
        options.validityDays = parseInt(args[++i]);
        break;
      case "--help":
      case "-h":
        console.log("TLS 证书生成工具");
        console.log("");
        console.log("用法:");
        console.log("  deno run --allow-all scripts/generate-cert.ts [选项]");
        console.log("");
        console.log("选项:");
        console.log("  --dir <路径>     指定证书输出目录 (默认: backend/cert)");
        console.log("  --cn <名称>      指定证书通用名 (默认: localhost)");
        console.log("  --days <天数>    指定证书有效期 (默认: 365)");
        console.log("  -h, --help       显示帮助信息");
        return;
    }
  }

  console.log("========== 生成 TLS 证书 ==========");
  console.log(`输出目录: ${options.certDir}`);
  console.log(`通用名: ${options.commonName}`);
  console.log(`有效期: ${options.validityDays} 天`);
  console.log("==================================\n");

  try {
    await generateCertificate(options);
  } catch (error) {
    console.error(`\n❌ 证书生成失败: ${error.message}`);
    Deno.exit(1);
  }
}

if (import.meta.main) {
  await main();
}