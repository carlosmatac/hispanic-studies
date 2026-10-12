# Institute for Hispano Studies
## Complete bilingual developer handoff / Instrucciones completas bilingües

**Platform / Plataforma:** Hostinger + WordPress + WooCommerce  
**Version / Versión:** 27 September / septiembre 2026  
**Domain / Dominio:** hispanostudies.com  
**Contact / Contacto:** hispanostudies@gmail.com  
**Status / Estado:** Implementation brief. Content and production launch require owner review. / Documento de implementación. El contenido y la publicación definitiva requieren revisión del propietario.

---

# PART I — ENGLISH

## 1. Project decision and scope

Build the Institute for Hispano Studies website on the existing Hostinger account using self-hosted WordPress and WooCommerce. This decision supersedes earlier instructions proposing Shopify as the website or checkout platform. Use one WordPress installation, one WooCommerce store, one customer/order database, and one shared cart for books and merchandise.

The site must serve as the Institute’s bilingual institutional home, media discovery hub, newsletter acquisition channel, and store. De Indiis Editions is the publishing identity within this ecosystem, with its own introduction and catalog inside the same website. It does not require a second hosting plan, WordPress installation, or commerce subscription.

The site must support English and Spanish at launch. Portuguese is part of the Institute’s intellectual and publishing mission, but a Portuguese website is a later phase, not a launch requirement.

“Everything on WordPress + WooCommerce” means website content management and commerce. YouTube remains the video host, Substack remains an essay destination where appropriate, Discord remains the community platform, and external services handle newsletter delivery, payments, and physical fulfillment. Do not recreate those services inside WordPress.

Keep the main navigation exactly:

**Watch · Read · Books · About · Merch**

Add a visible language switcher and cart icon in the header. The homepage logo links home. Contact and community can be accessed through About and the footer; they do not need additional top-level navigation items.

## 2. Existing assets and account ownership

The owner’s Hostinger screenshot shows:

| Item | Renewal amount shown | Next billing date |
| --- | --- | --- |
| hispanostudies.com domain | €16.99 | 23 March 2027 |
| Premium Web Hosting | €119.88 | 5 April 2027 |

Confirm the renewal period, taxes, actual resources, backup facilities, and available site slots inside the account. The screenshot does not establish whether the displayed hosting renewal is for one year. If it is annual, its equivalent is €9.99/month. These are renewal amounts, not new fees required to begin development.

Use existing hosting first. Do not buy another hosting package, change the domain registrar, or upgrade to Business solely because ecommerce is involved. Establish whether a concrete resource, backup, or performance requirement justifies an upgrade. Hostinger’s proprietary builder restrictions must not be confused with installing WooCommerce on WordPress.

The owner retains ownership of the domain, Hostinger, WordPress administrator account, payment processors, newsletter service, Printify, Tapstitch, and any publisher fulfillment account. Give the developer a separate account with appropriate access. Do not share the owner’s master password or place credentials in this brief.

Inventory the existing Shopify store before migration: products, variants, images, SKUs, order obligations, customer consents, URLs, and fulfillment connections. Do not cancel it until the replacement passes checkout and fulfillment tests and outstanding orders are accounted for. No new Shopify subscription is part of this build.

## 3. Editorial identity and visitor priorities

The Institute is a media, educational, and cultural project dedicated to the study, defense, and promotion of Hispanic civilization. Its orientation is Hispanist, Social-Catholic, and communitarian. Present that identity clearly, with historical rigor. Do not imply accreditation, university status, a staffed research campus, or qualifications the owner has not supplied.

Primary audience: English-speaking Hispanics in the United States seeking a deeper understanding of their inheritance. Spanish-speaking readers and other interested audiences must also feel welcome.

The primary homepage action is newsletter signup in exchange for the free pamphlet. Supporting actions are discovering publications, watching videos, reading essays, and understanding the mission. A visitor from a short video should immediately understand the project and the free offer; an existing follower should be able to reach a book, article, video, or merch item directly through navigation.

Prioritize content structure, readability, accessibility, and ease of maintenance. Aesthetic decisions must support these functions; no particular decorative style or paid theme is required.

## 4. Launch sitemap and navigation

Routes below are proposed English source routes. Spanish versions should be generated by the bilingual system, normally under `/es/`, rather than through a second installation. Translated Spanish URL slugs are optional and depend on the chosen plugin/license; do not promise them as a free feature.

| Destination | Proposed route | Type and purpose |
| --- | --- | --- |
| Home | `/` | Newsletter-first overview |
| Watch | `/watch/` | Curated short and long videos |
| Read | `/read/` | Essay previews, initially linking to Substack |
| Books / De Indiis Editions | `/books/` | Publisher introduction and book catalog in one destination |
| Individual book | WooCommerce product route | Bibliographic details, formats, purchase |
| About | `/about/` | Institute introduction and collaborator biographies |
| Our Mission | `/mission/` | Full seven-part manifesto |
| Contact | `/contact/` | General, collaboration, publishing, and order inquiries |
| Merch | `/merch/` | Merchandise collection |
| Individual merch product | WooCommerce product route | Variants, sizing, delivery, purchase |
| Community | Section within About at launch | Discord invitation and expectations |
| Signup confirmation | `/thank-you/` plus Spanish version | Explain confirmation and pamphlet delivery |
| Social links | `/links/` | Compact own-domain alternative to Linktree |
| Cart and checkout | WooCommerce system pages | One checkout across product types |
| Account | WooCommerce account page if enabled | Orders and downloads; account not mandatory by default |
| Privacy, terms, shipping, returns | Dedicated pages | Owner-approved policies and store information |

About dropdown: Our Mission, Who We Are (anchor on About), Community (anchor), Contact. Books links directly to the publisher/catalog page; avoid two competing publisher homepages at launch.

Footer: mission, contact, community, newsletter, active social accounts, publisher link, store policies, privacy, accessibility/contact route, language choice, and copyright. List Facebook and Xiaohongshu only when real accounts are active. Do not create dead links or invent URLs.

Use WooCommerce categories/attributes to distinguish books, digital editions, and merch. The underlying Shop archive may exist, but should not compete with the deliberate Books and Merch navigation.

## 5. Homepage: mandatory sequence and copy

Preserve this vertical sequence in both languages:

| Order | Section | Required content | Main action | Editorial source |
| --- | --- | --- | --- | --- |
| 1 | Hero + lead magnet | Institute name; clear introduction; pamphlet title, cover or honest placeholder; signup form | Get the free PDF | Owner’s pamphlet and approved copy |
| 2 | Featured works / books | De Indiis Editions introduction; selected WooCommerce books when available | Explore books / view publication | WooCommerce catalog |
| 3 | Latest articles / videos | Prominent short-form video selection plus latest essays | Watch / read more | YouTube and editorial essay records |
| 4 | About / mission | Concise statement; link to full manifesto; brief team introduction | Read our mission / meet the team | Approved mission and biographies |
| 5 | Community + collaboration | Discord invitation and clear collaboration route | Join / contact | Owner-provided community information |
| 6 | Footer | Secondary newsletter link, navigation, social accounts, policies | Find a specific destination | Site settings |

Do not put a large introductory mission essay above the signup. Do not replace the lead magnet with a vague “stay updated” message. Merchandise remains easy to find through the header; it should not displace the required publication and content hierarchy.

### English hero copy — proposed launch text

**Institute for Hispano Studies**

**Discover 200 years of Hispanic reunification thought.**

Sign up for the Institute’s newsletter and receive *Hispanic Reunification: 200 Years of Theory and Praxis*, a free 20–50-page pamphlet from De Indiis Editions. Explore the ideas and projects that have sought to reunite the Hispanic world—and receive new essays, videos, and publication announcements.

**Primary button:** Get the free PDF  
**Email label:** Email address  
**Optional name label:** First name  
**Consent text:** I would like to receive the Institute’s newsletter and publication updates. I can unsubscribe at any time.  
**Secondary link:** Explore our work

Finalize the stated page count after typesetting. The signup form must not promise an immediate PDF until the file and delivery workflow actually work. If the pamphlet is not ready, use a clearly labeled launch-notification offer instead, with owner-approved wording. Do not invent a release date.

### Publication availability states

Before commercial books exist, section 2 can introduce De Indiis Editions and honestly feature the free pamphlet or confirmed forthcoming work. Use “Forthcoming” without checkout when appropriate. Hide prices, purchase buttons, and preorders unless the owner has authorized an actual offer. Once books are available, populate the section from WooCommerce; do not maintain a second manual price list.

## 6. Core page briefs and editable content

### Watch

Launch with a curated selection of 3–6 Shorts and selected long-form videos, interviews, or podcasts. Each item needs title, YouTube URL/ID, thumbnail, format, language, topic, short description, and publication date. Display language and caption availability accurately. A Spanish page may feature an English video labeled “English”; translating the page does not translate the recording.

Use responsive portrait presentation for Shorts and landscape for long-form media. Load a thumbnail first and the player only when requested or near view. No autoplay with sound. Provide “Watch on YouTube” whenever embedding is unavailable. Verify the current supported YouTube embed behavior during implementation.

Manual curation is the launch default: it gives editorial control and avoids a required recurring feed-plugin subscription. An automated feed is a later option; quote its fees, caching, API requirements, and failure behavior before adding it.

### Read

Use editorial cards linking to the owner’s existing Substack essays at launch. Keep the publication’s established name unless the owner changes it. Each record contains headline, author, date, original language, excerpt, image, topic, and destination URL. Make the destination explicit, such as “Read on Substack.”

Create reusable WordPress entries with an external-link field and publication-type setting so the same card design can later display original WordPress essays. Do not copy complete Substack articles automatically or require every essay to be published twice. WordPress owns the preview; Substack owns the original essay when externally hosted. The Institute newsletter is a separate signup, not a disguised Substack subscription.

### Books / De Indiis Editions

Explain the publisher’s relationship to the Institute and its focus on translation, publication, and republication of texts relevant to Hispanic thought and reunification. Do not invent a legal company status, distribution network, publication list, submissions policy, or launch date.

Use one flexible page containing publisher introduction, featured work, catalog when available, and publishing inquiry link. Add author/translator pages only when there is meaningful content to populate them.

Reusable book product fields: title; subtitle; author; editor/translator when applicable; imprint; description; cover/gallery; edition; publication language; format; ISBN where applicable; page count; dimensions for print; publication date when confirmed; price; stock/availability; shipping expectations; sample when authorized; downloadable-file details; related works; and rights/permissions status for internal use.

Distinguish website language from the language of the purchased book. A shopper on the Spanish website must not accidentally buy an English edition believing it is translated. Display language and format beside the purchase control and in the cart/order summary.

### About / Who We Are

Include a concise institutional introduction and editable collaborator biographies. The owner will supply names, portraits, roles, and biographies after the section exists. Do not publish invented biographies, stock-photo “team members,” or empty profile cards.

Biography fields: name; accurate role; portrait and alt text; short biography; relevant background; interests; languages if supplied; selected contributions; authorized external links. Start with cards and expandable/full text on About. Individual profile pages become worthwhile when a person has several contributions to collect.

### Our Mission

Use a short homepage summary and a separate full manifesto page. Do not duplicate the full manifesto across the homepage and About. Preserve its seven-part sequence in section 7 below. The owner’s final English and Spanish manifesto copy is authoritative.

### Contact and community

Display hispanostudies@gmail.com and provide a short form: name, email, inquiry category, message, and privacy acknowledgement appropriate to the approved policy. Categories: general; collaboration/media; publishing/translation; order support. Show an optional order-number field only for order support. No file uploads at launch. Add accessible spam protection and a confirmation message; test actual delivery.

The Discord section should explain discussion, study, collaboration, and community expectations in owner-approved language. Preserve the server’s actual name and use an owner-verified invitation. Do not imply guaranteed academic supervision, employment, or formal membership benefits.

## 7. Mission content and manifesto architecture

### Proposed homepage summary

The Institute for Hispano Studies is dedicated to the study, defense, and renewal of Hispanic civilization. Through audiovisual work, publishing, translation, and community, we seek to make its history and intellectual traditions accessible across languages and borders.

### Mandatory order for the full manifesto

This is an implementation outline drawn from the owner’s notes, not a replacement for the final manifesto previously developed. The developer must insert the owner’s approved bilingual text without independently rewriting its intellectual position.

1. **Against the Black Legend of Spanish and American history.** Explain that the Institute’s concern includes the Americas and the self-understanding of their peoples, not Spain alone.
2. **In defense of the Catholic inheritance.** Include the Church, the evangelization of the Americas, and Our Lady of Guadalupe as patroness of the Americas. Explain the owner’s position that Catholicism has shaped moral, psychological, anthropological, and cultural life even beyond personal religious observance, and preserve the intended critique of anti-Catholicism.
3. **In defense of mestizaje.** Address biological and cultural mixture and the political, cultural, linguistic, and spiritual inheritance associated with Spain and Portugal. Preserve the owner’s inclusive civilizational use of “Hispanic”; do not turn it into a racial eligibility rule.
4. **In defense of Spanish and Portuguese / Iberofonía.** Explain their shared international cultural space. Any exact speaker count or comparative historical claim must be confirmed by the owner/editor before publication; do not invent a replacement statistic.
5. **An intellectual tradition of reunification.** Preserve the narrative concerning the independence era, fragmentation, Bolívar, the Monroe Doctrine and Pan-Americanism, the crisis of 1898, and intellectual exchange across the Atlantic and the Philippines. Present the Institute’s interpretation clearly and have factual chronology and quotations reviewed editorially.
6. **Plural expressions of Hispanism.** Explain the variety of approaches—including monarchist, republican, socialist, and Falangist currents named in the notes—and the ambition to study their arguments across national and ideological boundaries. Do not imply that publishing or studying a text endorses every position held by its author.
7. **The Institute’s practical mission.** Consolidate and make accessible this intellectual tradition in English, Spanish, and Portuguese through audiovisual work; translation, publication, and republication; and an intercontinental community of collaborators. Include the examples Manuel Ugarte, José Vasconcelos, and Gustavo Bueno where they appear in the approved text. End with newsletter, Discord, and contact invitations.

The trilingual mission does not mean the launch website has three language versions. Retain the distinction. The owner’s working title for the free pamphlet remains exactly *Hispanic Reunification: 200 Years of Theory and Praxis*.

## 8. WordPress implementation and plugin policy

Use a maintained, lightweight, WooCommerce-compatible theme and the WordPress block editor wherever practical. Avoid a paid page-builder dependency unless it delivers an agreed benefit. Routine edits must not require code.

Use reusable blocks/templates for hero, signup, content cards, video cards, collaborator biographies, publication details, and community calls to action. Store structured data in suitable fields; do not hard-code people, products, prices, or video IDs into theme files. Put essential custom functionality in a small documented plugin rather than tying it to a theme.

Required functions, with preferred starting points:

| Function | Starting approach | Cost treatment |
| --- | --- | --- |
| Website | WordPress on existing Hostinger | Existing hosting |
| Commerce and downloads | WooCommerce core | Free core software |
| Two website languages | TranslatePress Free; prove compatibility first | Free baseline; quote any required upgrade |
| Newsletter | Kit Free as baseline candidate | Confirm current limits; owner chooses account |
| Payments | Supported WooCommerce gateway for the actual seller | Processing fees; verify gateway terms |
| Printify / Tapstitch | Official documented WooCommerce connections | Fulfillment costs; verify connector requirements |
| Forms | One maintained form solution | Free where adequate |
| Caching/performance | One compatible system suited to Hostinger | Avoid overlapping cache plugins |
| Backup/security/mail delivery | Verify hosting provision; fill genuine gaps | Itemize any paid requirement |
| SEO | One maintained SEO solution | Document multilingual limits separately |

Do not install overlapping translation, cache, security, or SEO plugins. Maintain a register of plugin name, purpose, owner, license, renewal, and replacement/export considerations. No paid subscription may be introduced without a concrete cost and purpose being presented to the owner.

## 9. English/Spanish behavior and translation limits

Use English as the source/default language and Spanish under `/es/` unless the owner changes this before URL finalization. Keep the language selector in the header on desktop and mobile; use “English / Español” or clearly labeled EN / ES, not flags alone.

Switch to the equivalent page or product while preserving cart contents. Do not send every language change back to the homepage. Keep an explicit visitor choice; no forced geolocation redirect. Use one inventory record per actual product/edition, not duplicate English and Spanish stock records merely to translate descriptions.

Translate menus, buttons, forms, validation, product copy, attributes, cart, checkout, order confirmation, policy text, and download instructions. Separately test transactional emails, gateway messages, dynamic stock/error states, and third-party embeds. These are not automatically solved by a translated homepage. Capture order/subscriber language where needed. If a plugin cannot localize a critical transaction message, document the gap and price a fix or propose an explicit bilingual message for owner approval.

TranslatePress Free is the budget starting point for two languages. Its advanced translated SEO titles, meta descriptions, slugs, and multilingual sitemap integration may require its paid SEO features. Do not claim that a separate free SEO plugin removes these limits. Present two clearly priced scopes: usable bilingual launch; enhanced multilingual SEO. Do not silently make paid functionality a mandatory free-plan acceptance condition.

For the selected scope, validate HTML language attributes, crawlable language URLs, canonical and hreflang behavior, and sitemap coverage. Avoid search-indexing unfinished translations. Where media or an external article lacks translation, label the original language honestly.

## 10. Newsletter and pamphlet delivery

Implement the hero form in both languages, with consistent signup elsewhere. The initial offer is the free De Indiis Editions PDF, not a paid subscription. Do not require a WooCommerce account or a checkout order to obtain it.

Proposed flow: choose language → submit form → see confirmation instructions → confirm email if double opt-in is enabled → receive/access the correct pamphlet → receive subsequent newsletters in the selected language.

Use separate EN/ES forms or reliable language fields/tags. Preserve the exact English title; the proposed Spanish rendering is *Reunificación hispánica: 200 años de teoría y praxis*, subject to owner approval. Do not promise a Spanish PDF until it exists. If only English is ready, clearly say “PDF in English” on the Spanish signup or offer Spanish-edition launch notifications.

Kit Free is a baseline candidate for forms, broadcasts, and lead-magnet confirmation-email delivery. Advanced sequences and automation may require a paid plan. Verify the current account limits when implementing. The platform comparison is not authorization to buy a paid newsletter tier. Keep the list exportable and document any branding or network settings.

Test consent storage, language tagging, duplicate signups, invalid addresses, confirmation links, expired/broken download links, mobile completion, and unsubscribe behavior. Do not automatically add shoppers or import all Substack subscribers into a separate promotional list without the owner confirming an appropriate consent basis. Newsletter emails and WooCommerce transactional emails are separate delivery systems; configure and test each.

## 11. WooCommerce catalog, payments, and downloads

Use Books and Merch as distinct public browsing areas with one cart. Set the default selling currency to USD as the working assumption; a Spanish interface does not imply euro pricing. Confirm the actual selling entity, address, bank account, fulfillment locations, and countries served before configuring payments, taxes, and shipping. A US-billed software account alone does not establish those facts.

Allow guest checkout unless the owner requests otherwise. Give optional account creation where useful for order history and downloads. Provide clear format/language labels, accessible validation, receipts, and order-support information.

Physical books: configure dimensions, weight, inventory/production status, shipping regions, and handling times. For print-on-demand books, Lulu Direct is an optional documented WooCommerce route, not an assumed contract. Confirm book specifications, rights, print cost, shipping, fulfillment charges, and samples before activating it. Merch suppliers should not be assumed to print the publisher’s books.

Digital books: use WooCommerce downloadable products, normally marked virtual when no physical item ships. Attach the correct edition/file; configure order statuses that grant access, download limits/expiry if desired, and customer instructions. Do not grant downloads for failed/unpaid orders. Decide how refunds affect future access and document the policy. Test guest and account downloads.

Do not place paid PDFs behind ordinary public WordPress Media Library links. Use supported WooCommerce protected-download storage and verify direct unauthorized access is blocked. Explain that download protection is not DRM and cannot prevent a purchaser sharing a downloaded file. Back up the paid files separately from public media as appropriate.

If print and digital formats use one product with variations, prove inventory, file assignment, shipping, and fulfillment behavior for each variation. Otherwise use separate clearly related products. Physical print language editions with distinct stock/ISBNs must remain distinguishable from translated storefront descriptions.

## 12. Merch fulfillment: Printify and Tapstitch

Connect the owner’s Printify and Tapstitch accounts to WooCommerce through their documented routes. Do not assume Shopify product IDs or fulfillment bindings transfer automatically. Reconcile every SKU and variant, supplier, image, price, size chart, stock state, and shipping profile.

Use one supplier route per purchasable variant. Both services must not fulfill the same item. Confirm which order/payment status triggers production, how tracking returns to WooCommerce, who pays the supplier, and what happens when production fails or a supplier charge is declined.

Use a safe test configuration initially so developer test orders do not create accidental paid production. Demonstrate each connector; place a controlled real sample/order only with the owner’s authorization for the charge.

Test carts combining a book, Printify item, Tapstitch item, and a digital download. Shipping must account for separate origins and parcels without charging shipping on the digital item. Communicate split shipments and realistic delivery ranges. Do not promise cancellations after manufacturing begins unless the supplier supports them.

Give the owner an exception workflow for unmapped variants, unavailable products, supplier payment failure, address errors, missing tracking, and refunds. Store receipt, payment, and supplier status must be understandable without inspecting code.

## 13. Performance, accessibility, and operations

Embed externally hosted videos; do not upload the video archive to shared hosting. Optimize images, use responsive sizes, and delay heavy embeds. Keep cart, checkout, account, and other personalized pages out of inappropriate full-page caching. Test cache behavior in both languages and ensure one user never sees another user’s cart.

Implement keyboard navigation, visible focus, labeled forms, meaningful headings, alt text, readable contrast, mobile menus, and captions/transcripts where available. Make consent and error messages accessible. Avoid a popup that blocks the initial lead-magnet form.

Configure HTTPS, separate administrator accounts, backups of database/files/downloads, and a documented restore procedure. Verify the actual Premium plan’s backup frequency and retention; do not assume Business features are included. Maintain off-site recoverability if the hosting backup is insufficient. Keep WordPress, theme, and plugins updated with a rollback procedure and agreed maintenance owner.

Configure authenticated transactional email delivery using a suitable provider and the owner’s DNS. Confirm order, contact, password-reset, and download messages arrive. Newsletter and store mail may share the sending domain but require compatible DNS configuration. Do not overwrite existing email records blindly.

Use a private development environment with no live payment/fulfillment credentials unless needed for an authorized test. Prevent search indexing and public discovery of unfinished pages. At launch, switch production indexing deliberately and verify no development blocks remain.

Add analytics only with an agreed purpose and approved consent configuration. Useful events: newsletter completion, video interaction, article click, book/product view, add to cart, and purchase. Measure completed signup separately from a button click.

## 14. Migration and launch order

1. Confirm hosting resources, existing website contents, domain/DNS, email dependencies, Shopify obligations, account access, and current costs.
2. Build a private WordPress prototype with theme, WooCommerce, and translation.
3. Demonstrate one bilingual page/product, checkout, transactional message, and protected download. Resolve translation gaps before filling the entire site.
4. Build reusable templates and the mandatory homepage sequence.
5. Import/rebuild the catalog with a SKU mapping sheet; reconnect fulfillment. Preserve necessary historical order records. Do not promise customer password migration or automatic transfer of consent.
6. Add supplied copy, portraits, media, newsletter forms, PDFs, policies, and product assets. Hide sections without sufficient content.
7. Run acceptance checks below and resolve defects.
8. Obtain owner review of the actual site, final recurring-cost register, policies, and launch readiness.
9. Publish, verify DNS/SSL/indexing, and monitor checkout, mail, and fulfillment. Redirect known old product/page URLs where technically possible; update social/link-in-bio destinations.
10. Cancel redundant Shopify service only after outstanding obligations and the replacement are handled. Retain backups and necessary exports.

## 15. Acceptance checklist — required before launch

- [ ] Header navigation matches Watch, Read, Books, About, Merch and its approved Spanish labels.
- [ ] Hero signup is first; books second; articles/videos third; mission/about fourth.
- [ ] Language switcher is visible on mobile and desktop and opens equivalent content.
- [ ] Cart and inventory remain consistent across language changes.
- [ ] All public launch pages have reviewed EN/ES text; any untranslated media is labeled.
- [ ] Product language/format is clear before payment and in order details.
- [ ] Newsletter forms record consent and language and deliver the intended file/notification.
- [ ] No unavailable pamphlet, invented book, biography, preorder, or inactive social link is published.
- [ ] Success, failure, cancellation, refund, and duplicate-payment/webhook cases are handled without duplicate fulfillment.
- [ ] Paid downloads cannot be obtained through an exposed direct public URL and are delivered only when allowed.
- [ ] Printify and Tapstitch mapping, trigger, tracking, and exception flows work.
- [ ] Mixed physical/digital and multi-supplier carts calculate shipping correctly.
- [ ] Contact and order-related emails are delivered and understandable in the chosen launch language scope.
- [ ] Mobile menu, keyboard use, labels, error states, and video fallbacks work.
- [ ] Policies, seller details, shipping territories, and tax/payment configuration have owner review.
- [ ] HTTPS, backup/restore, update responsibility, and owner account access are documented.
- [ ] Selected SEO scope is delivered; paid-plugin limitations are disclosed.
- [ ] No test credentials, placeholder content, duplicate tracking, or unintended indexing blocks remain.
- [ ] Owner receives a training session and complete handoff materials.

## 16. Budget and handoff requirements

Quote separately: design/build; content entry/translation labor; migration; integration setup; optional extensions; maintenance; and hosting upgrades if justified. List every recurring charge in its actual currency, billing interval, introductory rate, renewal rate, and cancellation/export implications. Present monthly equivalents without disguising annual upfront payments.

The free software baseline is not a promise of a zero-cost finished website. The existing hosting is prepaid, but payment processing, production, shipping, domain renewal, developer labor, and possible premium features still cost money. Avoid paid extensions until a specific requirement proves them necessary.

Deliver: working site; owner admin access; editable templates; content-field guide; plugin/license register; DNS/service map; backup/restore instructions; order/fulfillment troubleshooting guide; SKU migration mapping; redirect list; short video or live training; and maintenance agreement with named responsibilities. Include custom source files and explain how to export content and orders.

Train the owner to add a video, feature an essay, edit a biography, update either language, publish a book, replace a download safely, manage a merch order, and edit the homepage without code.

## 17. Owner inputs and launch phases

The owner supplies: final mission/manifesto in both languages; logos and authorized imagery; collaborator names/biographies/portraits; actual channel URLs and Discord invitation; selected videos/essays; final PDF(s) and cover; book rights and bibliographic details; merch designs/SKUs; seller/payment/shipping information; policies; and access invitations. Existing intellectual-background PDFs are research context, not automatically products or authorized public downloads.

Launch now: bilingual core site, newsletter offer in an honest availability state, Watch, Read, Mission/About/Contact, active merchandise, and a publisher introduction. Enable paid books only when real products and fulfillment are ready.

Next phase: larger catalog, topic collections, contributor pages, improved multilingual SEO, automated video feed if justified, and original WordPress essays where editorially useful.

Only when justified: Portuguese website, courses, events, memberships, donations, sophisticated learning paths, or research programs. Do not create empty destinations for hypothetical activities. Add sitewide content search when the content volume merits it; keep product discovery usable from launch.

## 18. Five decisions to settle before production configuration

1. What is the actual selling entity, location, payment account, and initial shipping territory?
2. Will printed books ship from stock or use a named print-on-demand supplier?
3. Which language editions of the free pamphlet will be ready at launch, and how many newsletter subscribers must the chosen service accommodate?
4. What active Shopify products/orders and Printify/Tapstitch mappings must migrate?
5. Who maintains the website after handoff, and is enhanced multilingual SEO part of the initial paid scope?

Proceed with templates and the private prototype while these are resolved. Do not invent answers or hold up reversible layout work unnecessarily.

---

# PARTE II — ESPAÑOL

## 1. Decisión del proyecto y alcance

Construir la web del Institute for Hispano Studies en la cuenta de Hostinger existente, con WordPress autohospedado y WooCommerce. Esta decisión sustituye las instrucciones anteriores que proponían Shopify como web o plataforma de cobro. Usar una instalación de WordPress, una tienda WooCommerce, una base de clientes/pedidos y un carrito compartido para libros y merchandising.

La web será la sede institucional bilingüe, el punto de descubrimiento de contenidos, el canal de captación del boletín y la tienda. De Indiis Editions tendrá identidad editorial, presentación y catálogo dentro de la misma web. No necesita otro alojamiento, otra instalación ni otra suscripción de comercio electrónico.

Publicar en inglés y español desde el lanzamiento. El portugués forma parte de la misión intelectual y editorial, pero su incorporación como idioma de la web pertenece a una fase posterior.

«Todo con WordPress + WooCommerce» se refiere a la gestión de la web y del comercio. YouTube seguirá alojando los vídeos, Substack seguirá siendo el destino de los ensayos que allí se publiquen, Discord albergará la comunidad y los servicios externos gestionarán boletines, pagos y producción/envío. No reconstruir estos servicios dentro de WordPress.

La navegación principal será:

**Ver · Leer · Libros · Quiénes somos · Merchandising**

Estos rótulos corresponden a **Watch · Read · Books · About · Merch**. Añadir selector de idioma visible e icono del carrito en la cabecera. El logotipo enlaza al inicio. Contacto y comunidad estarán en Quiénes somos y en el pie; no necesitan nuevas entradas principales.

## 2. Activos existentes y titularidad de cuentas

La captura de Hostinger del propietario muestra:

| Servicio | Importe de renovación mostrado | Próxima facturación |
| --- | --- | --- |
| Dominio hispanostudies.com | 16,99 € | 23 de marzo de 2027 |
| Premium Web Hosting | 119,88 € | 5 de abril de 2027 |

Comprobar en la cuenta el período de renovación, impuestos, recursos, copias de seguridad y número de sitios disponibles. La captura no demuestra que la renovación del alojamiento sea anual. Si lo fuera, equivaldría a 9,99 €/mes. Son importes de renovación futura, no pagos nuevos necesarios para empezar.

Aprovechar primero el alojamiento actual. No comprar otro plan, cambiar de registrador ni ampliar a Business únicamente por tratarse de una tienda. Justificar cualquier ampliación con una necesidad concreta de recursos, copias o rendimiento. No confundir las restricciones del constructor propietario de Hostinger con WooCommerce instalado sobre WordPress.

El propietario conservará la titularidad del dominio, Hostinger, administrador de WordPress, procesadores de pago, boletín, Printify, Tapstitch y cualquier proveedor editorial. El desarrollador tendrá acceso separado y adecuado. No compartir la contraseña principal ni incluir credenciales en este documento.

Inventariar Shopify antes de migrar: productos, variantes, imágenes, SKU, pedidos pendientes, consentimientos, URL y conexiones logísticas. No cancelarlo hasta validar cobros y envíos en la nueva tienda y resolver obligaciones pendientes. Este proyecto no requiere contratar una nueva suscripción Shopify.

## 3. Identidad editorial y prioridades del visitante

El Instituto es un proyecto mediático, educativo y cultural dedicado al estudio, defensa y promoción de la civilización hispánica. Su orientación es hispanista, socialcatólica y comunitarista. Expresar esta identidad con claridad y rigor histórico. No insinuar acreditación universitaria, instalaciones de investigación, personal o credenciales que no se hayan aportado.

Público principal: hispanos angloparlantes de Estados Unidos que buscan comprender mejor su herencia. La web también debe acoger a hispanohablantes y demás interesados.

La acción principal del inicio es suscribirse al boletín para recibir el folleto gratuito. Las acciones secundarias son descubrir publicaciones, ver vídeos, leer ensayos y conocer la misión. Quien llegue desde un vídeo corto debe entender de inmediato el proyecto y la oferta; el seguidor habitual debe acceder directamente al contenido o producto que busca.

Priorizar estructura, legibilidad, accesibilidad y mantenimiento sencillo. La estética estará al servicio de esas funciones; no se exige un estilo decorativo específico ni una plantilla de pago.

## 4. Mapa del sitio y navegación de lanzamiento

Las rutas de la tabla son rutas fuente propuestas en inglés. Las versiones españolas deben generarse mediante el sistema bilingüe, normalmente bajo `/es/`, sin otra instalación. Traducir los propios segmentos de las URL es opcional y depende del complemento/licencia; no prometerlo como función gratuita.

| Destino | Ruta propuesta | Función |
| --- | --- | --- |
| Inicio | `/` | Presentación centrada en la suscripción |
| Ver | `/watch/` | Vídeos cortos y largos seleccionados |
| Leer | `/read/` | Avances de ensayos, inicialmente enlazados a Substack |
| Libros / De Indiis Editions | `/books/` | Presentación editorial y catálogo conjunto |
| Libro individual | Ruta de producto WooCommerce | Ficha bibliográfica, formatos y compra |
| Quiénes somos | `/about/` | Presentación y biografías |
| Nuestra misión | `/mission/` | Manifiesto completo de siete partes |
| Contacto | `/contact/` | Consultas generales, editoriales, colaboraciones y pedidos |
| Merchandising | `/merch/` | Colección de artículos |
| Artículo individual | Ruta de producto WooCommerce | Variantes, tallas, envío y compra |
| Comunidad | Sección de Quiénes somos | Discord y expectativas |
| Confirmación de suscripción | `/thank-you/` y versión española | Instrucciones de confirmación y entrega |
| Enlaces sociales | `/links/` | Alternativa propia a Linktree |
| Carrito y pago | Páginas del sistema WooCommerce | Compra compartida entre categorías |
| Cuenta | Página WooCommerce, si se activa | Pedidos y descargas; cuenta no obligatoria por defecto |
| Privacidad, condiciones, envíos y devoluciones | Páginas propias | Políticas aprobadas por el propietario |

Desplegable de Quiénes somos: Nuestra misión, Equipo (ancla), Comunidad (ancla), Contacto. Libros lleva directamente a la página editorial/catálogo; evitar dos portadas editoriales que compitan entre sí.

Pie: misión, contacto, comunidad, boletín, redes activas, editorial, políticas, privacidad, vía de contacto sobre accesibilidad, idioma y copyright. Añadir Facebook y Xiaohongshu solo cuando existan cuentas activas. No inventar enlaces.

Distinguir libros, ediciones digitales y merchandising mediante categorías/atributos WooCommerce. El archivo general de tienda puede existir, pero no debe competir con la navegación Libros/Merchandising.

## 5. Inicio: secuencia obligatoria y textos

Mantener este orden vertical en ambos idiomas:

| Orden | Sección | Contenido | Acción | Fuente |
| --- | --- | --- | --- | --- |
| 1 | Cabecera principal + regalo | Nombre, presentación breve, folleto, portada y formulario | Obtener el PDF | Material y texto aprobados |
| 2 | Obras/libros destacados | De Indiis Editions y productos reales disponibles | Explorar libros | Catálogo WooCommerce |
| 3 | Artículos/vídeos recientes | Vídeos cortos destacados y ensayos | Ver / leer | YouTube y registros editoriales |
| 4 | Presentación/misión | Resumen, enlace al manifiesto y equipo | Conocer misión/equipo | Textos y biografías aprobados |
| 5 | Comunidad/colaboración | Discord y contacto | Participar / escribir | Información del propietario |
| 6 | Pie | Navegación, redes, políticas y recordatorio del boletín | Acceder a destinos concretos | Ajustes del sitio |

No colocar un largo ensayo institucional antes del formulario. No sustituir la oferta concreta por «mantente informado». El merchandising seguirá accesible en la cabecera, sin desplazar libros y contenidos del orden acordado.

### Propuesta de texto para la cabecera española

**Institute for Hispano Studies**

**Descubre 200 años de pensamiento sobre la reunificación hispánica.**

Suscríbete al boletín del Instituto y recibe *Reunificación hispánica: 200 años de teoría y praxis*, un folleto gratuito de 20–50 páginas de De Indiis Editions. Explora las ideas y los proyectos que han buscado reunir al mundo hispánico y recibe nuevos ensayos, vídeos y novedades editoriales.

**Botón principal:** Recibir el PDF gratuito  
**Campo:** Correo electrónico  
**Campo opcional:** Nombre  
**Consentimiento:** Quiero recibir el boletín del Instituto y sus novedades editoriales. Puedo darme de baja en cualquier momento.  
**Enlace secundario:** Explorar nuestro trabajo

El título español es una propuesta pendiente de aprobación. El título inglés permanece exactamente *Hispanic Reunification: 200 Years of Theory and Praxis*. Actualizar el número de páginas tras la maquetación. No prometer entrega inmediata ni edición española si no están disponibles; en ese caso, indicar el idioma del PDF o usar una oferta clara de aviso de lanzamiento, sin inventar fechas.

### Estados de disponibilidad editorial

Antes de tener libros comerciales, presentar De Indiis Editions y destacar honestamente el folleto gratuito o una obra futura confirmada. Usar «Próximamente» sin compra cuando corresponda. No mostrar precios, preventas o botones de compra sin una oferta real autorizada. Cuando existan libros, obtener productos y precios de WooCommerce; no mantener otra lista manual de precios.

## 6. Páginas y contenidos editables

### Ver

Empezar con 3–6 Shorts seleccionados y algunos vídeos largos, entrevistas o pódcast. Campos: título, URL/ID de YouTube, miniatura, formato, idioma, tema, descripción y fecha. Indicar correctamente idioma y subtítulos. Una página española puede mostrar un vídeo inglés con su etiqueta; traducir la página no traduce la grabación.

Diseño vertical adaptable para Shorts y horizontal para vídeos largos. Cargar primero miniatura y después reproductor por interacción o proximidad. Sin reproducción automática con sonido. Añadir «Ver en YouTube» como alternativa. Comprobar las capacidades vigentes de inserción durante la implementación.

La selección manual será la opción inicial: control editorial y ausencia de una suscripción obligatoria a un complemento de feeds. Automatizar posteriormente solo tras explicar precio, caché, API y comportamiento ante fallos.

### Leer

Publicar tarjetas que enlacen a los ensayos existentes en Substack, conservando su nombre de publicación actual. Campos: título, autor, fecha, idioma original, extracto, imagen, tema y URL. Indicar «Leer en Substack» cuando corresponda.

Crear registros reutilizables con campo de enlace externo y tipo de publicación, preparados para futuros ensayos propios. No duplicar automáticamente artículos completos ni obligar a publicar cada ensayo dos veces. WordPress mantiene el avance; Substack el original cuando allí se aloja. La suscripción al boletín del Instituto es independiente de Substack.

### Libros / De Indiis Editions

Explicar la relación editorial con el Instituto y el interés por traducir, publicar y reeditar textos sobre pensamiento hispánico y reunificación. No inventar constitución jurídica, red de distribución, catálogo, convocatoria de originales o fecha de lanzamiento.

Una página flexible reunirá presentación, obra destacada, catálogo disponible y contacto editorial. Crear páginas de autores/traductores solo cuando haya contenido suficiente.

Ficha reutilizable: título, subtítulo, autor, editor/traductor, sello, descripción, portada/galería, edición, idioma de la obra, formato, ISBN cuando corresponda, páginas, dimensiones de impresión, fecha confirmada, precio, disponibilidad, envío, muestra autorizada, información de descarga, obras relacionadas y estado interno de derechos/permisos.

Distinguir idioma de navegación e idioma del libro. Mostrar idioma/formato junto al botón de compra, en el carrito y en el pedido. Navegar en español no convierte una edición inglesa en una edición traducida.

### Quiénes somos / Equipo

Presentación institucional y biografías editables. El propietario aportará nombres, cargos, fotografías y textos cuando exista la sección. No publicar perfiles inventados, fotografías de archivo como miembros reales ni tarjetas vacías.

Campos: nombre, función precisa, retrato y texto alternativo, biografía breve, trayectoria pertinente, intereses, idiomas si se aportan, colaboraciones y enlaces autorizados. Comenzar con tarjetas y texto ampliado en esta misma página. Crear perfiles individuales cuando acumulen varias contribuciones.

### Nuestra misión

Resumen breve en el inicio y manifiesto completo en página propia. No repetir íntegramente el manifiesto en Inicio y Quiénes somos. Mantener las siete partes de la sección 7 y usar como autoridad el texto final aprobado por el propietario.

### Contacto y comunidad

Mostrar hispanostudies@gmail.com. Formulario: nombre, correo, categoría, mensaje y reconocimiento de privacidad adecuado a la política aprobada. Categorías: general; colaboración/prensa; edición/traducción; ayuda con pedidos. Número de pedido opcional solo en esta última. Sin adjuntos inicialmente. Protección antispam accesible, mensaje de confirmación y prueba real de recepción.

Explicar estudio, conversación, colaboración y expectativas de Discord con texto aprobado. Conservar el nombre real del servidor y usar invitación verificada. No prometer supervisión académica, empleo ni beneficios formales inexistentes.

## 7. Misión y arquitectura del manifiesto

### Resumen propuesto para el inicio

El Institute for Hispano Studies está dedicado al estudio, la defensa y la renovación de la civilización hispánica. Mediante contenidos audiovisuales, edición, traducción y comunidad, buscamos hacer accesibles su historia y sus tradiciones intelectuales más allá de las fronteras y de las lenguas.

### Orden obligatorio del manifiesto completo

Este esquema de implementación procede de las notas del propietario; no sustituye el manifiesto definitivo elaborado anteriormente. Insertar su versión bilingüe aprobada, sin que el desarrollador reescriba por su cuenta la posición intelectual.

1. **Contra la Leyenda Negra de la historia española y americana.** Incluir sus efectos en América y en la comprensión que sus pueblos tienen de sí mismos, no solamente en España.
2. **En defensa de la herencia católica.** Iglesia, evangelización de América y Virgen de Guadalupe como patrona de las Américas. Expresar la tesis del propietario sobre la formación moral, psicológica, antropológica y cultural del catolicismo, más allá de la observancia individual, y preservar la crítica prevista del anticatolicismo.
3. **En defensa del mestizaje.** Dimensiones biológica y cultural, junto con la herencia política, cultural, lingüística y espiritual asociada a España y Portugal. Mantener el uso civilizacional e inclusivo de «hispánico» sin convertirlo en un criterio racial de admisión.
4. **En defensa del español y del portugués / Iberofonía.** Explicar su espacio cultural internacional compartido. El propietario/editor debe confirmar cualquier cifra exacta de hablantes o comparación histórica antes de publicar; no inventar otra estadística.
5. **Una tradición intelectual de reunificación.** Mantener el relato sobre independencias, fragmentación, Bolívar, doctrina Monroe y panamericanismo, crisis de 1898 e intercambio intelectual transatlántico y filipino. Expresar la interpretación del Instituto y revisar editorialmente cronología y citas.
6. **Pluralidad de hispanismos.** Incluir los enfoques monárquicos, republicanos, socialistas y falangistas mencionados en las notas y el estudio de sus argumentos más allá de fronteras e ideologías. Estudiar o publicar una obra no equivale a adherirse a todas las posiciones de su autor.
7. **Misión práctica del Instituto.** Sistematizar y facilitar el acceso a esta tradición en inglés, español y portugués mediante producción audiovisual; traducción, publicación y reedición; y una comunidad intercontinental de colaboradores. Mantener las referencias a Manuel Ugarte, José Vasconcelos y Gustavo Bueno donde aparezcan en el texto aprobado. Concluir con boletín, Discord y contacto.

La misión trilingüe no exige una web trilingüe desde el lanzamiento. Conservar esa distinción.

## 8. Implementación WordPress y política de complementos

Usar una plantilla ligera, mantenida y compatible con WooCommerce, y el editor de bloques cuando sea práctico. Evitar dependencia de un constructor de pago sin beneficio acordado. Las actualizaciones editoriales ordinarias no deben exigir código.

Crear bloques/plantillas reutilizables para cabecera, formulario, tarjetas, vídeos, biografías, libros y comunidad. Almacenar datos estructurados en campos adecuados; no fijar personas, precios, productos o ID de vídeo dentro de archivos de plantilla. Separar la funcionalidad esencial personalizada en un pequeño complemento documentado.

| Función | Solución inicial | Tratamiento económico |
| --- | --- | --- |
| Web | WordPress en Hostinger existente | Alojamiento actual |
| Tienda y descargas | WooCommerce | Núcleo gratuito |
| Dos idiomas | TranslatePress Free, previa comprobación | Base gratuita; presupuestar mejoras |
| Boletín | Kit Free como candidato inicial | Confirmar límites y cuenta elegida |
| Pagos | Pasarela compatible con el vendedor real | Comisiones del procesador |
| Printify/Tapstitch | Conexiones WooCommerce documentadas | Producción/envío; verificar requisitos |
| Formularios | Una solución mantenida | Gratuita si resulta suficiente |
| Caché | Un sistema compatible con Hostinger | Evitar duplicidades |
| Copias, seguridad y correo | Verificar lo incluido y cubrir carencias | Desglosar cualquier pago |
| SEO | Una solución mantenida | Separar límites de SEO multilingüe |

No instalar complementos redundantes de traducción, caché, seguridad o SEO. Entregar inventario con finalidad, titular, licencia, renovación y posibilidades de exportación/sustitución. Presentar coste y motivo antes de contratar cualquier suscripción.

## 9. Funcionamiento bilingüe y límites

Inglés como idioma fuente y español bajo `/es/`, salvo cambio del propietario antes de fijar URL. Selector en cabecera de escritorio y móvil: «English / Español» o EN / ES con etiquetas comprensibles; no solo banderas.

Cambiar a la página o producto equivalente conservando el carrito. No devolver siempre al inicio ni imponer redirecciones por geolocalización. Mantener un registro de inventario por producto/edición real; no duplicarlo para traducir una descripción.

Traducir navegación, botones, formularios, validación, productos, atributos, carrito, pago, confirmación, políticas y descargas. Comprobar aparte correos transaccionales, mensajes de pasarela, errores dinámicos, existencias e inserciones externas. Registrar idioma de pedido/suscriptor cuando corresponda. Si un complemento no localiza un mensaje crítico, documentar la carencia y presupuestar la solución o proponer un mensaje bilingüe explícito para aprobación.

TranslatePress Free es el punto de partida económico. Traducir metatítulos, metadescripciones, segmentos URL e integrar mapas multilingües avanzados puede exigir funciones SEO de pago. Otro complemento SEO gratuito no elimina automáticamente estas limitaciones. Presupuestar por separado lanzamiento bilingüe funcional y SEO multilingüe avanzado. No imponer silenciosamente funciones de pago como requisitos de la opción gratuita.

Validar, según alcance contratado, atributos de idioma HTML, URL rastreables, canonical, hreflang y mapa del sitio. No indexar traducciones incompletas. Identificar el idioma original de vídeos o artículos externos sin traducción.

## 10. Boletín y entrega del folleto

Formulario principal en ambos idiomas y acceso coherente desde otras secciones. El regalo es un PDF gratuito de De Indiis Editions, no una suscripción de pago. No exigir cuenta WooCommerce ni pedido para obtenerlo.

Flujo: elegir idioma → enviar formulario → instrucciones → confirmar correo si se activa doble confirmación → acceder al folleto correcto → recibir posteriores boletines en el idioma elegido.

Usar formularios separados o campos/etiquetas de idioma fiables. Título inglés exacto: *Hispanic Reunification: 200 Years of Theory and Praxis*. Propuesta española: *Reunificación hispánica: 200 años de teoría y praxis*. No prometer traducción inexistente: si solo está disponible en inglés, indicarlo o recoger avisos para la futura edición española.

Kit Free es candidato inicial para formularios, boletines y entrega mediante correo de confirmación. Las secuencias y automatizaciones avanzadas pueden exigir pago. Verificar límites vigentes; la comparación previa no autoriza contratar un plan de pago. Mantener exportable la lista y documentar marca del proveedor y ajustes de su red de recomendaciones.

Probar consentimiento, idioma, duplicados, direcciones inválidas, enlaces, descarga, móvil y bajas. No incorporar automáticamente compradores ni toda la audiencia de Substack a otra lista sin que el propietario confirme una base adecuada de consentimiento. Configurar y probar por separado boletines y correo transaccional de WooCommerce.

## 11. Catálogo, pagos y descargas WooCommerce

Libros y Merchandising serán áreas distintas con carrito compartido. USD como moneda inicial propuesta; navegar en español no implica pagar en euros. Confirmar entidad vendedora, domicilio, banco, origen logístico y países atendidos antes de configurar pagos, impuestos y envíos. La facturación estadounidense de una herramienta no demuestra esos datos.

Permitir compra como invitado salvo decisión contraria. Cuenta opcional para historial y descargas. Etiquetas claras, validación accesible, recibos y ayuda sobre pedidos.

Libros físicos: dimensiones, peso, inventario/producción, regiones y plazos. Lulu Direct es una opción documentada para impresión bajo demanda, no un contrato supuesto. Confirmar especificaciones, derechos, costes, cargos de preparación, envío y ejemplares de prueba antes de activarlo. No asumir que los proveedores de prendas imprimen libros editoriales.

Libros digitales: productos descargables, normalmente virtuales cuando no hay envío físico. Adjuntar el archivo/edición correcto; definir estados que conceden acceso, límites/caducidad e instrucciones. No dar acceso con pagos fallidos o pendientes. Acordar cómo afectan los reembolsos al acceso futuro. Probar descargas de invitados y usuarios registrados.

No servir PDF de pago mediante enlaces públicos ordinarios de la biblioteca multimedia. Usar almacenamiento y métodos de descarga protegidos compatibles con WooCommerce y probar que no se accede sin autorización. Aclarar que esto no es DRM ni impide compartir un archivo ya descargado. Incluir estos archivos en la estrategia de copias.

Si se agrupan impresión y digital como variaciones, verificar inventario, archivos, envío y logística por variación. Si no, usar productos separados y relacionados claramente. Las ediciones lingüísticas con inventario/ISBN propios no deben confundirse con traducciones de la ficha web.

## 12. Merchandising: Printify y Tapstitch

Conectar las cuentas del propietario mediante las rutas WooCommerce documentadas. No asumir que los ID y vínculos de Shopify se transfieren solos. Conciliar SKU, variantes, proveedor, imágenes, precios, tallas, disponibilidad y perfiles de envío.

Una ruta de proveedor por variante comprable; nunca ambos servicios produciendo el mismo artículo. Confirmar estado de pago/pedido que activa producción, retorno del seguimiento, cargo al vendedor y respuesta ante fallo de fabricación o cobro del proveedor.

Empezar con configuración de prueba segura para evitar producción pagada accidental. Demostrar ambos conectores; hacer un pedido real de muestra solo con autorización del propietario para el cargo.

Probar carritos con libro, artículo Printify, artículo Tapstitch y descarga. Calcular correctamente orígenes y paquetes separados sin cobrar envío al digital. Explicar entregas separadas y plazos realistas. No prometer cancelación tras iniciar producción sin respaldo del proveedor.

Entregar procedimiento para variantes sin asignar, agotados, fallo de pago al proveedor, dirección errónea, falta de seguimiento y reembolsos. El propietario debe entender recibo, pago y estado logístico sin revisar código.

## 13. Rendimiento, accesibilidad y operación

Alojar vídeos fuera de Hostinger y embeberlos. Optimizar imágenes y retrasar reproductores pesados. Excluir carrito, pago, cuenta y contenido personalizado de cachés incompatibles. Probar ambos idiomas y aislamiento de carritos entre usuarios.

Navegación por teclado, foco visible, etiquetas, jerarquía de encabezados, texto alternativo, contraste, menú móvil y subtítulos/transcripciones disponibles. Consentimientos y errores accesibles. Ningún popup debe bloquear el formulario principal.

HTTPS, cuentas separadas, copias de base de datos/archivos/descargas y procedimiento de restauración. Verificar frecuencia y retención reales del plan Premium; no dar por incluidas funciones Business. Asegurar recuperación externa si las copias del alojamiento no bastan. Mantener actualizaciones y reversión con responsable definido.

Configurar envío autenticado de correo y DNS correspondiente. Probar pedidos, contacto, recuperación de contraseña y descargas. Los servicios de boletín y tienda pueden compartir dominio remitente, pero sus registros deben ser compatibles. No sobrescribir registros de correo existentes sin revisión.

Desarrollar en entorno privado, sin credenciales productivas salvo prueba autorizada. Evitar indexación y exposición pública del contenido incompleto. Activar deliberadamente la indexación definitiva y comprobar que no quedan bloqueos de desarrollo.

Analítica con finalidad acordada y configuración de consentimiento aprobada. Eventos útiles: suscripción completada, interacción con vídeo, clic a artículo, ficha de libro/producto, carrito y compra. No confundir un clic con una suscripción completada.

## 14. Migración y secuencia de lanzamiento

1. Confirmar recursos, web existente, DNS/correo, obligaciones Shopify, accesos y costes.
2. Prototipo privado WordPress con plantilla, WooCommerce y traducción.
3. Demostrar página/producto bilingüe, pago, mensaje transaccional y descarga protegida. Resolver carencias antes de cargar toda la web.
4. Construir plantillas y secuencia obligatoria de inicio.
5. Importar/reconstruir catálogo con mapa SKU y reconectar logística. Conservar registros necesarios; no prometer migración de contraseñas ni consentimiento automático.
6. Añadir textos, retratos, medios, formularios, PDF, políticas y productos. Ocultar secciones vacías.
7. Ejecutar verificaciones de aceptación y corregir defectos.
8. Revisión del propietario sobre web real, costes recurrentes, políticas y preparación.
9. Publicar y comprobar DNS/SSL/indexación; supervisar pagos, correo y logística. Redirigir URL conocidas cuando sea posible y actualizar enlaces sociales.
10. Cancelar Shopify redundante solo tras resolver obligaciones y validar el reemplazo. Conservar exportaciones y copias necesarias.

## 15. Lista de aceptación obligatoria

- [ ] Navegación acordada en ambos idiomas.
- [ ] Orden: formulario/regalo, libros, artículos/vídeos, misión/presentación.
- [ ] Selector visible y vinculado a contenido equivalente en móvil y escritorio.
- [ ] Carrito e inventario coherentes al cambiar idioma.
- [ ] Textos revisados EN/ES; medios sin traducir etiquetados.
- [ ] Idioma/formato del producto visibles antes del pago y en pedido.
- [ ] Formularios registran consentimiento/idioma y entregan archivo o aviso correcto.
- [ ] Sin regalos inexistentes, libros/biografías inventados, preventas no autorizadas o redes inactivas.
- [ ] Éxito, fallo, cancelación, reembolso y eventos duplicados no generan logística duplicada.
- [ ] Descargas protegidas y concedidas solo cuando corresponde.
- [ ] Asignación, activación, seguimiento y excepciones de Printify/Tapstitch comprobados.
- [ ] Envío correcto en carritos mixtos y con varios proveedores.
- [ ] Correos de contacto/pedido entregados y comprensibles según alcance lingüístico aprobado.
- [ ] Menú móvil, teclado, etiquetas, errores y alternativas a vídeos funcionan.
- [ ] Datos del vendedor, políticas, territorios, impuestos y pagos revisados por el propietario.
- [ ] HTTPS, copias/restauración, actualizaciones y accesos documentados.
- [ ] SEO contratado entregado y límites de complementos declarados.
- [ ] Sin credenciales de prueba, contenido provisional, seguimiento duplicado o bloqueos de indexación accidentales.
- [ ] Formación y documentación entregadas.

## 16. Presupuesto y entrega

Desglosar diseño/construcción, carga/traducción, migración, conexiones, extensiones, mantenimiento y ampliaciones justificadas. Para cada pago recurrente: moneda, frecuencia, promoción, renovación y consecuencias de cancelación/exportación. Mostrar equivalentes mensuales sin ocultar cobros anuales anticipados.

Software gratuito no equivale a web terminada sin costes. El alojamiento está prepagado, pero siguen existiendo comisiones, producción, envío, dominio, trabajo técnico y posibles funciones de pago. Contratar extensiones solo ante una necesidad concreta.

Entregar web operativa, acceso administrador, plantillas editables, guía de campos, inventario de complementos/licencias, mapa DNS/servicios, copias/restauración, resolución de problemas de pedidos, mapa SKU, redirecciones, formación y acuerdo de mantenimiento. Incluir código personalizado y procedimientos de exportación de contenido/pedidos.

Enseñar a añadir vídeos, destacar ensayos, editar biografías e idiomas, publicar libros, sustituir descargas con seguridad, gestionar merchandising y cambiar el inicio sin código.

## 17. Aportaciones del propietario y fases

El propietario aportará manifiesto definitivo EN/ES, logotipos e imágenes autorizadas, nombres/biografías/retratos, enlaces reales e invitación Discord, vídeos/ensayos, PDF y portada, derechos y datos bibliográficos, diseños/SKU, información comercial/logística, políticas e invitaciones de acceso. Los PDF de contexto intelectual no son automáticamente productos ni descargas públicas autorizadas.

Lanzar: web bilingüe, oferta honesta del boletín, Ver, Leer, Misión/Quiénes somos/Contacto, merchandising activo y presentación editorial. Activar libros de pago solo con productos y logística preparados.

Siguiente fase: ampliar catálogo, colecciones temáticas, perfiles, SEO multilingüe avanzado, feed automático justificado y ensayos originales cuando tenga sentido editorial.

Solo si se justifica: portugués, cursos, eventos, membresías, donaciones, itinerarios de aprendizaje complejos o programas de investigación. No crear destinos vacíos. Añadir buscador general cuando el volumen lo requiera, manteniendo descubrimiento de productos útil desde el principio.

## 18. Cinco decisiones antes de configurar producción

1. ¿Cuál es la entidad vendedora real, su ubicación, cuenta de cobro y territorio inicial de envío?
2. ¿Los libros físicos se enviarán desde existencias o mediante qué proveedor de impresión bajo demanda?
3. ¿Qué idiomas del folleto estarán listos y cuántos suscriptores deberá admitir el servicio de boletín?
4. ¿Qué productos/pedidos Shopify y asignaciones Printify/Tapstitch hay que migrar?
5. ¿Quién mantendrá la web y se incluye SEO multilingüe avanzado en el presupuesto inicial?

Continuar con plantillas y prototipo privado mientras se resuelven. No inventar respuestas ni bloquear trabajo reversible de estructura.

---

# Technical references / Referencias técnicas

Official documentation checked for this brief or the preceding platform comparison on 27 September 2026. Recheck account-specific entitlements and current connector/plugin compatibility before implementation. / Documentación oficial consultada para este documento o la comparación previa el 27 de septiembre de 2026. Volver a comprobar prestaciones de la cuenta y compatibilidad antes de implementar.

1. Hostinger — Install ecommerce CMS / Instalar plataforma de comercio: https://www.hostinger.com/support/1583676-how-to-install-an-ecommerce-or-business-cms-at-hostinger/
2. Hostinger — Builder ecommerce restrictions / Restricciones del constructor: https://www.hostinger.com/support/6538318-hostinger-ai-builder-manual-mode-how-to-enable-ecommerce-features-on-your-website/
3. WooCommerce — Core pricing / Coste del núcleo: https://woocommerce.com/pricing/
4. WooCommerce — Downloadable products / Productos descargables: https://woocommerce.com/document/digital-downloadable-product-handling/
5. TranslatePress — Free bilingual WooCommerce / WooCommerce bilingüe gratuito: https://translatepress.com/woocommerce-multilingual-free/
6. TranslatePress — Paid plans / Planes de pago: https://translatepress.com/pricing/
7. Printify — WooCommerce connection / Conexión WooCommerce: https://help.printify.com/hc/en-us/articles/4483637152401-How-can-I-connect-my-WooCommerce-store-to-Printify
8. Tapstitch — WooCommerce connection / Conexión WooCommerce: https://www.tapstitch.com/help-center/faq/detail/integrate-my-Woocommerce-store
9. Kit — Free plan / Plan gratuito: https://help.kit.com/en/articles/16627071-the-kit-free-plan
10. Kit — Lead-magnet confirmation email / Correo de confirmación con regalo: https://help.kit.com/en/articles/2502655-the-confirmation-email
11. Kit — Pricing / Precios: https://kit.com/pricing
12. Lulu — Direct sales and integrations / Venta directa e integraciones: https://www.lulu.com/sell/sell-on-your-site
13. Lulu — Fulfillment charges / Cargos logísticos: https://help.luludirect.lulu.com/en/support/solutions/articles/64000270795-how-are-lulu-direct-prices-calculated-and-what-will-i-pay-

This brief does not authorize a developer to publish unapproved manuscript text, buy subscriptions, cancel services, or place paid production orders without the owner’s applicable authorization. / Este documento no autoriza por sí solo a publicar manuscritos no aprobados, contratar suscripciones, cancelar servicios o hacer pedidos de producción de pago sin la autorización correspondiente del propietario.
