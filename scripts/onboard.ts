import * as readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';

const rl = readline.createInterface({ input, output });

async function onboard() {
  console.log('\n🚀 Welcome to Digital Lab Onboarding\n');
  console.log('This script will help you set up your Digital Lab instance.\n');

  const institutionName = await rl.question('Institution Full Name (e.g., SMA Universitas Islam Indonesia): ') || 'SMA Universitas Islam Indonesia Yogyakarta';
  const shortName = await rl.question('Short Name (e.g., SMA UII): ') || 'SMA UII';
  const location = await rl.question('Location (e.g., Yogyakarta): ') || 'Yogyakarta';
  const website = await rl.question('Institution Website: ') || 'https://smauiiyk.sch.id';

  const siteName = await rl.question('Site Name (e.g., SMA UII Lab): ') || `${shortName} Lab`;
  const description = await rl.question('Site Description: ') || 'Ruang eksplorasi digital buat yang suka ngulik teknologi';

  const githubOrg = await rl.question('GitHub Organization URL: ') || 'https://github.com/SMA-UII-Yogyakarta';
  const repository = await rl.question('GitHub Repository URL: ') || 'https://github.com/SMA-UII-Yogyakarta/SMA-UII-Yogyakarta.github.io';
  const domain = await rl.question('Production Domain (e.g., lab.smauiiyk.sch.id): ') || 'lab.smauiiyk.sch.id';

  const slims = (await rl.question('Enable SLiMS Integration? (y/n): ')).toLowerCase() === 'y';

  const config = `export const DEFAULT_CONFIG = {
  site: {
    name: ${JSON.stringify(siteName)},
    description: ${JSON.stringify(description)},
    themeColor: "#3b82f6",
    logoSymbol: "⬡"
  },
  institution: {
    name: ${JSON.stringify(institutionName)},
    shortName: ${JSON.stringify(shortName)},
    location: ${JSON.stringify(location)},
    website: ${JSON.stringify(website)}
  },
  deployment: {
    domain: ${JSON.stringify(domain)},
    repository: ${JSON.stringify(repository)}
  },
  socials: {
    github: ${JSON.stringify(githubOrg)},
    maintainerGithub: "https://github.com/sandikodev"
  },
  features: {
    slimsIntegration: ${slims},
    birthdayEvents: true
  }
};

/**
 * In a real universal deployment, this would be loaded from a JSON file
 * or environment variables. For now, we provide this as a central source of truth.
 */
export const getSiteConfig = () => {
  return DEFAULT_CONFIG;
};

export type SiteConfig = typeof DEFAULT_CONFIG;
`;

  const configPath = path.join(process.cwd(), 'packages/shared/src/config.ts');
  await fs.writeFile(configPath, config);

  console.log(`\n✅ Configuration written to ${configPath}`);

  // Also update CNAME for GitHub Pages if applicable
  const cnamePath = path.join(process.cwd(), 'apps/web/public/CNAME');
  try {
    await fs.writeFile(cnamePath, domain);
    console.log(`✅ CNAME updated to ${domain}`);
  } catch (e) {
    console.log('⚠️ Could not update CNAME file.');
  }

  console.log('\n🎉 Onboarding complete! Next steps:');
  console.log('1. Commit the changes: git add . && git commit -m "chore: initial onboarding"');
  console.log('2. Push to your repository: git push');
  console.log('3. Follow the deployment guide in docs/DEPLOYMENT.md\n');

  rl.close();
}

onboard().catch(console.error);
