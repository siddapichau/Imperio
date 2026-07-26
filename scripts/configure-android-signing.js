#!/usr/bin/env node

/**
 * Garante que o APK seja sempre assinado com a MESMA chave.
 *
 * POR QUE ISSO IMPORTA PARA O LOGIN COM GOOGLE
 * --------------------------------------------
 * O "Entrar com Google" no Android só é liberado quando a impressão digital SHA-1 do
 * certificado que assinou o APK está cadastrada num cliente OAuth do tipo *Android* no
 * Google Cloud, junto com o nome do pacote (br.com.imperialbatista.app).
 *
 * Por padrão o Gradle assina builds de debug com um `~/.android/debug.keystore` gerado na
 * hora. No GitHub Actions cada execução começa numa máquina limpa, ou seja: **cada build
 * teria um SHA-1 diferente** e o Google recusaria o login logo depois (erro 28444
 * "Developer console is not set up correctly"), mesmo com tudo configurado.
 *
 * Este script fixa a chave em `android/app/imperio-release.keystore` (versionada no repo),
 * de modo que o SHA-1 seja sempre o mesmo — no seu computador e no GitHub Actions.
 *
 * A chave é de assinatura de *distribuição interna* (fora da Play Store). Se um dia o app
 * for para a Play Store, gere uma chave nova e privada e cadastre o SHA-1 dela também.
 */

const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const androidDir = path.join(root, 'android');
const appDir = path.join(androidDir, 'app');
const buildGradlePath = path.join(appDir, 'build.gradle');

const KEYSTORE_FILE = 'imperio-release.keystore';
const KEYSTORE_PASSWORD = 'imperio2026';
const KEY_ALIAS = 'androiddebugkey';

const MARKER = '// === Imperio: assinatura fixa (SHA-1 estável para o login Google) ===';

const SIGNING_BLOCK = `
${MARKER}
// Não remova: sem uma chave fixa o SHA-1 muda a cada build e o Google bloqueia o login.
android {
    signingConfigs {
        imperio {
            storeFile file('${KEYSTORE_FILE}')
            storeType 'PKCS12'
            storePassword '${KEYSTORE_PASSWORD}'
            keyAlias '${KEY_ALIAS}'
            keyPassword '${KEYSTORE_PASSWORD}'
        }
    }
    buildTypes {
        debug {
            signingConfig signingConfigs.imperio
        }
        release {
            signingConfig signingConfigs.imperio
        }
    }
}
`;

function fail(message) {
  console.error('❌ ' + message);
  process.exit(1);
}

function main() {
  if (!fs.existsSync(buildGradlePath)) {
    fail(`Projeto Android não encontrado (${path.relative(root, buildGradlePath)}). Rode "npx cap add android" antes.`);
  }

  const source = path.join(root, 'android-signing', KEYSTORE_FILE);
  const target = path.join(appDir, KEYSTORE_FILE);

  if (!fs.existsSync(source)) {
    fail(`Keystore não encontrada em ${path.relative(root, source)}.`);
  }

  fs.copyFileSync(source, target);

  let gradle = fs.readFileSync(buildGradlePath, 'utf8');
  if (gradle.includes(MARKER)) {
    console.log('ℹ️  Assinatura fixa já estava configurada.');
  } else {
    gradle = gradle.trimEnd() + '\n' + SIGNING_BLOCK;
    fs.writeFileSync(buildGradlePath, gradle, 'utf8');
    console.log('✅ Assinatura fixa aplicada em android/app/build.gradle.');
  }

  console.log(`✅ Keystore copiada para android/app/${KEYSTORE_FILE}.`);
}

main();
