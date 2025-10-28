<div align="center">

# 📚 BookLore

### A Beautiful Self-Hosted Personal Library Manager

![GitHub release (latest by date)](https://img.shields.io/github/v/release/adityachandelgit/BookLore?color=green)
![License](https://img.shields.io/github/license/adityachandelgit/BookLore?color=orange)
![Stars](https://img.shields.io/github/stars/adityachandelgit/BookLore?style=social)
![Docker Pulls](https://img.shields.io/docker/pulls/booklore/booklore?color=2496ED)

[![Join us on Discord](https://img.shields.io/badge/Chat-Discord-5865F2?logo=discord&style=flat)](https://discord.gg/Ee5hd458Uz)
[![Open Collective backers and sponsors](https://img.shields.io/opencollective/all/booklore?label=Open%20Collective&logo=opencollective&color=7FADF2)](https://opencollective.com/booklore)
[![Venmo](https://img.shields.io/badge/Venmo-Donate-008CFF?logo=venmo)](https://venmo.com/AdityaChandel)

![BookLore Demo](assets/demo.gif)

*Build and explore your personal library with intuitive organization, powerful metadata, and seamless multi-user support*

</div>

---

## 🚨 Important Announcement

> **Docker images have moved to new repositories:**
> 
> - 🐳 **Docker Hub:** `https://hub.docker.com/r/booklore/booklore`
> - 📦 **GitHub Container Registry:** `https://ghcr.io/booklore-app/booklore`
>
> The legacy repo (`https://ghcr.io/adityachandelgit/booklore-app`) will remain available for existing images but will not receive further updates.

---

## ✨ Key Features

<table>
<tr>
<td width="50%">

### 📚 Library Management
- **Smart Organization** - Custom shelves, smart sorting, and powerful filters
- **Magic Shelves** - Dynamic, rule-based collections that auto-update
- **BookDrop Import** - Drop files for automatic detection and bulk import
- **Multi-User Support** - Granular permissions for library access

</td>
<td width="50%">

### 🔗 Integrations
- **Kobo Sync** - Seamless device integration with auto KEPUB conversion
- **KOReader Sync** - Track reading progress across devices
- **OPDS Support** - Connect reading apps directly to your library
- **Metadata Fetching** - Auto-import from Goodreads, Amazon, Google Books

</td>
</tr>
<tr>
<td width="50%">

### 📖 Reading Experience
- **Built-in Reader** - Read PDFs, EPUBs, and comics
- **Customizable Themes** - Personalize your reading experience
- **Progress Tracking** - Never lose your place
- **Private Notes** - Save personal reading notes

</td>
<td width="50%">

### 🔐 Security & Sharing
- **Flexible Auth** - Local accounts or OIDC providers (Authentik, Pocket ID)
- **One-Click Sharing** - Send books via email directly
- **Community Reviews** - Auto-fetch public reviews
- **Mobile Ready** - Fully responsive design

</td>
</tr>
</table>

---

## 🌐 Try the Live Demo

<div align="center">

**Experience BookLore without installing**

🌐 **URL:** [demo.booklore.dev](https://demo.booklore.dev)  
👤 **Username:** `booklore`  
🔑 **Password:** `9HC20PGGfitvWaZ1`

> ⚠️ **Demo Limitations:** Standard user permissions only. Deploy your own instance to explore admin features like user management and advanced configuration.

</div>

---

## 💖 Support the Project

Your support helps keep BookLore growing and improving!

<div align="center">

| Method | Description |
|--------|-------------|
| ⭐ **Star this repo** | Show your appreciation and help others discover BookLore |
| 💸 **[Open Collective](https://opencollective.com/booklore)** | Fund development, hosting, and testing costs |
| ⚡ **[Venmo](https://venmo.com/AdityaChandel)** | One-time donations |

### Current Fundraising Goal

📌 **Kobo Device for Testing** - Help us implement native Kobo sync support!  
💡 [Support the Kobo Sync Bounty →](https://opencollective.com/booklore/projects/kobo-device-for-testing)

</div>

---

## 🚀 Getting Started

### 📘 Documentation & Guides

| Resource | Description |
|----------|-------------|
| 📚 **[Official Documentation](https://booklore-app.github.io/booklore-docs/docs/getting-started/)** | Complete installation, setup, and configuration guide |
| 🎥 **[YouTube Tutorials](https://www.youtube.com/watch?v=UMrn_fIeFRo&list=PLi0fq0zaM7lqY7dX0R66jQtKW64z4_Tdz)** | Visual walkthroughs (some content may be outdated) |
| 💡 **[Contribute to Docs](https://github.com/booklore-app/booklore-docs)** | Help improve our documentation |

---

## 🐳 Docker Deployment

### Prerequisites

- [Docker](https://docs.docker.com/get-docker/)
- [Docker Compose](https://docs.docker.com/compose/install/)

### Quick Start

**1. Create a `.env` file:**

```ini
# Application Settings
APP_USER_ID=0
APP_GROUP_ID=0
TZ=Etc/UTC
BOOKLORE_PORT=6060

# Database Connection
DATABASE_URL=jdbc:mariadb://mariadb:3306/booklore
DB_USER=booklore
DB_PASSWORD=ChangeMe_BookLoreApp_2025!

# MariaDB Settings
DB_USER_ID=1000
DB_GROUP_ID=1000
MYSQL_ROOT_PASSWORD=ChangeMe_MariaDBRoot_2025!
MYSQL_DATABASE=booklore
```

**2. Create a `docker-compose.yml` file:**

```yaml
services:
  booklore:
    image: booklore/booklore:latest
    # Alternative: ghcr.io/booklore-app/booklore:latest
    container_name: booklore
    environment:
      - USER_ID=${APP_USER_ID}
      - GROUP_ID=${APP_GROUP_ID}
      - TZ=${TZ}
      - DATABASE_URL=${DATABASE_URL}
      - DATABASE_USERNAME=${DB_USER}
      - DATABASE_PASSWORD=${DB_PASSWORD}
      - BOOKLORE_PORT=${BOOKLORE_PORT}
    depends_on:
      mariadb:
        condition: service_healthy
    ports:
      - "${BOOKLORE_PORT}:${BOOKLORE_PORT}"
    volumes:
      - ./data:/app/data
      - ./books:/books
      - ./bookdrop:/bookdrop
    restart: unless-stopped

  mariadb:
    image: lscr.io/linuxserver/mariadb:11.4.5
    container_name: mariadb
    environment:
      - PUID=${DB_USER_ID}
      - PGID=${DB_GROUP_ID}
      - TZ=${TZ}
      - MYSQL_ROOT_PASSWORD=${MYSQL_ROOT_PASSWORD}
      - MYSQL_DATABASE=${MYSQL_DATABASE}
      - MYSQL_USER=${DB_USER}
      - MYSQL_PASSWORD=${DB_PASSWORD}
    volumes:
      - ./mariadb/config:/config
    restart: unless-stopped
    healthcheck:
      test: [ "CMD", "mariadb-admin", "ping", "-h", "localhost" ]
      interval: 5s
      timeout: 5s
      retries: 10
```

**3. Start the containers:**

```bash
docker compose up -d
```

**4. Access BookLore:**

Navigate to `http://localhost:6060` in your browser.

---

## 📥 BookDrop: Automatic Import

Drop your book files into a special folder and let BookLore handle the rest!

### How It Works

1. 📂 **Drop Files** - Place books in the BookDrop folder
2. 🔍 **Auto-Detection** - Background process monitors and extracts metadata
3. ✨ **Metadata Enrichment** - Optional fetching from Google Books, Open Library
4. ✅ **Review & Import** - Finalize imports through the BookDrop UI

### Docker Configuration

```yaml
volumes:
  - ./bookdrop:/bookdrop  # 👈 Enable BookDrop
```

---

## 🔐 Authentication Options

### OIDC/OAuth2 Integration

Integrate with external authentication providers for secure access.

**Tested Providers:**
- ✅ Authentik
- ✅ Pocket ID
- ✅ Authelia (should work)

**Setup Guides:**
- 📺 [Authentik Setup Video](https://www.youtube.com/watch?v=r6Ufh9ldF9M)
- 📘 [Pocket ID Setup Guide](docs/OIDC-Setup-With-PocketID.md)

### Forward Auth with Reverse Proxy

Authenticate through reverse proxies like Traefik, Nginx, or Caddy.

📘 [Complete Forward Auth Setup Guide](docs/forward-auth-with-proxy.md)

---

## 🤝 Community & Support

<div align="center">

| Channel | Purpose |
|---------|---------|
| 💬 **[Discord](https://discord.gg/Ee5hd458Uz)** | Chat with the community |
| 🐞 **[GitHub Issues](https://github.com/adityachandelgit/BookLore/issues)** | Report bugs and request features |
| ✨ **[CONTRIBUTING.md](https://github.com/adityachandelgit/BookLore/blob/master/CONTRIBUTING.md)** | Contribute to the project |

</div>

---

## 📊 Project Statistics

<div align="center">

### Repository Activity

![Alt](https://repobeats.axiom.co/api/embed/44a04220bfc5136e7064181feb07d5bf0e59e27e.svg "Repobeats analytics image")

### Star History

<a href="https://www.star-history.com/#booklore-app/booklore&type=date&legend=top-left">
 <picture>
   <source media="(prefers-color-scheme: dark)" srcset="https://api.star-history.com/svg?repos=booklore-app/booklore&type=date&theme=dark&legend=top-left" />
   <source media="(prefers-color-scheme: light)" srcset="https://api.star-history.com/svg?repos=booklore-app/booklore&type=date&legend=top-left" />
   <img alt="Star History Chart" src="https://api.star-history.com/svg?repos=booklore-app/booklore&type=date&legend=top-left" />
 </picture>
</a>

</div>

---

## 👨‍💻 Contributors

<div align="center">

Thanks to all the amazing people who contribute to BookLore! 💙

[![Contributors List](https://contrib.rocks/image?repo=adityachandelgit/BookLore)](https://github.com/adityachandelgit/BookLore/graphs/contributors)

</div>

---

## ⚖️ License

**GNU GPL v3** - Copyright 2024-2025

---

<div align="center">

Made with ❤️ by the BookLore community

[⬆ Back to Top](#-booklore)

</div>
