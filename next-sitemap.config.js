/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: process.env.SITE_URL || 'https://student-tracking-app.vercel.app',
  generateRobotsTxt: true,
  exclude: ['/api/*', '/setup/*'],
  robotsTxtOptions: {
    policies: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/setup/']
      }
    ]
  }
}
