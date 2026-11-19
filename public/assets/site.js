(() => {
'use strict';
const app=document.getElementById('app');
const school={name:'Shamsul Ulama Islamic Academy',area:'Perighala, Ernakulam, Kerala, India',affiliation:'Jamia Jalaliyya',affiliationLocation:'Mundakkulam, Malappuram, Kerala, India',phone:'+91 9496 845 773',phoneHref:'+919496845773',phoneAlt:'+91 9562 962 762',phoneAltHref:'+919562962762',hours:'8:30 AM – 9:00 PM'};
const photos={quran:'/assets/quran-photo.jpg',courtyard:'/assets/courtyard-photo.jpg'};
const menu=[['/','Home'],['/about','About the Academy'],['/gallery','Gallery'],['/admission','Admission'],['/contact','Contact']];
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const tel='<a href="tel:'+school.phoneHref+'">'+school.phone+'</a>';
const telAlt='<a href="tel:'+school.phoneAltHref+'">'+school.phoneAlt+'</a>';
function header(path){
 const navItems=[['/','Home'],['/about','About'],['/programmes','Academics'],['/gallery','Gallery'],['/admission','Admission'],['/contact','Contact']];
 return `<header class="header academy-header-v80 academy-header-v83">
  <div class="academy-utility-v80"><div class="container academy-utility-inner-v80">
   <div class="academy-contact-meta-v84" aria-label="Academy contact and location">
    <a class="academy-header-phone-v84" href="tel:${school.phoneHref}" aria-label="Call the Academy at ${school.phone}"><span class="academy-header-meta-icon-v84" aria-hidden="true">☎</span><span class="academy-header-phone-label-v84">Call:</span> <span class="academy-phone-text-v93">${esc(school.phone)}</span></a>
    <a class="academy-header-place-v84 academy-campus-link-v88" href="https://maps.app.goo.gl/Gj9mgHHR7gRG4MiQ6" target="_blank" rel="noopener noreferrer" aria-label="Find Shamsul Ulama Islamic Academy in Peringala, Ernakulam on Google Maps">
     <svg class="academy-campus-pin-v88" width="24" height="28" viewBox="0 0 24 28" xmlns="http://www.w3.org/2000/svg" fill="none" aria-hidden="true" focusable="false">
      <defs>
       <linearGradient id="academy-pin-gold-v88" x1="3" y1="2" x2="21" y2="23" gradientUnits="userSpaceOnUse"><stop stop-color="#FFF6C9"/><stop offset=".42" stop-color="#EAC578"/><stop offset="1" stop-color="#AE8537"/></linearGradient>
       <linearGradient id="academy-pin-inner-v88" x1="7" y1="5" x2="17" y2="18" gradientUnits="userSpaceOnUse"><stop stop-color="#26705C"/><stop offset="1" stop-color="#0C3C31"/></linearGradient>
      </defs>
      <ellipse cx="12" cy="25.5" rx="5.7" ry="1.5" fill="#000" opacity=".22"/>
      <path d="M12 1.6C6.55 1.6 2.6 5.5 2.6 10.9C2.6 17.3 10.9 24.4 11.4 24.85C11.77 25.18 12.23 25.18 12.6 24.85C13.1 24.4 21.4 17.3 21.4 10.9C21.4 5.5 17.45 1.6 12 1.6Z" fill="url(#academy-pin-gold-v88)" stroke="#FFE8AD" stroke-width=".7"/>
      <path d="M11.6 3.6C6.9 4 4.5 7.4 4.5 10.7" stroke="#FFFDF0" stroke-linecap="round" stroke-width="1.25" opacity=".85"/>
      <circle cx="12" cy="10.6" r="5.25" fill="url(#academy-pin-inner-v88)" stroke="#F4DEA4" stroke-width=".65"/>
      <circle cx="10.4" cy="9.1" r="1.2" fill="#FFF" opacity=".20"/>
     </svg>
     <span class="academy-campus-copy-v88"><span class="academy-campus-eyebrow-v88">VISIT OUR CAMPUS</span><span class="academy-campus-name-v88">Peringala, Ernakulam</span></span>
     <span class="academy-campus-arrow-v88" aria-hidden="true">↗</span>
    </a>
   </div>
   <nav class="academy-portals-v80" aria-label="Private academy portals">
    <a class="academy-portal-link-v80" href="/login?next=/dashboard">Students Login</a>
    <a class="academy-portal-link-v80" href="/login">Institution Login</a>
   </nav>
  </div></div>
  <div class="container head academy-head-v80">
   <a class="academy-identity-v80" data-route href="/" aria-label="Shamsul Ulama Islamic Academy — Home">
    <span class="academy-emblem-v80"><img class="academy-logo-v80" src="/assets/academy-logo-transparent-v82.png" width="116" height="120" alt="Official Shamsul Ulama Islamic Academy logo" fetchpriority="high"></span>
    <span class="academy-heading-v80"><img class="academy-calligraphy-v80" src="/assets/academy-original-calligraphy-v80.svg" width="1091" height="168" alt="أكاديمية شمس العلماء الإسلامية" decoding="async">
     <strong class="academy-title-v80">SHAMSUL ULAMA ISLAMIC ACADEMY</strong><span class="academy-place-v80">PERINGALA</span>
    </span>
   </a>
   <aside class="academy-admissions-panel-v85" aria-label="Admissions and enquiries">
    <div class="academy-admissions-inner-v85">
     <span class="academy-admissions-eyebrow-v85">ACADEMY OFFICE</span>
     <h2 class="academy-admissions-title-v85">Admissions &amp; Enquiries</h2>
     <a class="academy-admissions-phone-v85" href="tel:${school.phoneHref}" aria-label="Call the Academy"><span class="academy-admissions-tel-label-v85">Telephone</span><span class="academy-phone-text-v93">${esc(school.phone)}</span></a>
     <p class="academy-admissions-hours-v85"><span>Office hours</span><strong>${esc(school.hours)}</strong></p>
     <a class="academy-admissions-link-v85" data-route href="/admission">Admission Information <span aria-hidden="true">↗</span></a>
    </div>
   </aside>
  </div>
  <div class="academy-navigation-strip-v83">
   <div class="container academy-navigation-inner-v83">
    <button class="menu academy-mobile-menu-v80" aria-expanded="false" id="mobileMenu" aria-controls="nav" aria-label="Toggle navigation">☰</button>
    <nav class="links academy-nav-v80" id="nav" aria-label="Primary navigation">${navItems.map(([href,label])=>`<a data-route href="${href}" class="${path===href?'active':''}">${label}</a>`).join('')}</nav>
   </div>
  </div>
 </header>`;
}
function footer(){return '<footer class="footer academy-footer"><div class="container"><div class="academy-footer-grid">'+
'<div class="academy-footer-about"><a class="brand" href="/" data-route><span class="brand-logo-wrap"><img class="brand-logo" src="/assets/academy-logo-transparent-v82.png" alt="" width="62" height="65" decoding="async"></span><span><b>SHAMSUL ULAMA</b><small>ISLAMIC ACADEMY</small></span></a><p>Qur’an memorisation is at the heart of our work. School education, attentive guidance and careful daily revision help students grow in knowledge, good character and responsibility.</p><div class="academy-footer-affiliation"><span>ACADEMIC AFFILIATION</span><a href="https://jamiajalaliyya.com/" class="affiliation-link" target="_blank" rel="noopener noreferrer">'+esc(school.affiliation)+'</a><small id="footerAffiliationPlace">'+esc(school.affiliationLocation)+'</small></div></div>'+
'<nav class="academy-footer-links" aria-label="Footer navigation"><h3>Explore the Academy</h3><div class="footer-links">'+menu.map(([href,label])=>'<a data-route href="'+href+'">'+label+'</a>').join('')+'<a data-route href="/college-features">Our College Features</a><a data-route href="/programmes">School &amp; Tuition</a></div></nav>'+
'<div class="academy-footer-contact"><h3>Get in Touch</h3><p class="academy-footer-contact-label">ADDRESS</p><p class="academy-footer-address" id="footerAcademyAddress">'+esc(school.area)+'</p><p class="academy-footer-contact-label">PHONE</p><p class="academy-footer-phones">'+tel+'<span class="academy-footer-phone-separator">·</span>'+telAlt+'</p><p class="academy-footer-contact-label">CONTACT HOURS</p><p id="footerAcademyHours">'+school.hours+'</p><a class="academy-footer-contact-link" data-route href="/contact">Contact the Academy ↗</a></div>'+
'<div class="academy-footer-map"><h3>Find Our Academy</h3><div class="academy-footer-map-frame"><iframe title="Shamsul Ulama Islamic Academy exact location map" src="https://maps.google.com/maps?q=10.0051171%2C76.4025429&amp;z=17&amp;output=embed" loading="lazy" referrerpolicy="no-referrer-when-downgrade" allowfullscreen></iframe></div><a href="https://maps.app.goo.gl/pJvKQGRmfL5Tyjk5A" target="_blank" rel="noopener noreferrer" class="academy-footer-map-link">Open exact location in Google Maps ↗</a></div>'+
'</div><div class="academy-footer-bottom"><span>© '+new Date().getFullYear()+' Shamsul Ulama Islamic Academy. All rights reserved.</span><span>Qur’an Memorisation · Islamic &amp; Academic Education</span></div></div></footer>';}
function academyContactIcon(kind){
 const paths={
  call:'<path d="M6.5 4.4c-.8.2-2.6 2.2-2.3 4.1.5 3.4 7.1 10 10.5 10.6 1.9.3 3.9-1.6 4.1-2.4l-4-2.5-2.3 2.1c-2.2-1.1-4-2.9-5.1-5.1l2.1-2.3-2.5-4Z"/><path d="M13.5 5.1c3 .4 5 2.5 5.4 5.5M13.9 2.5c4.4.5 7.3 3.4 7.8 7.8"/>',
  admissions:'<path d="M4 4.5h10.8L20 9v10.5H4Z"/><path d="M14.7 4.5v4.6H20M7.5 12h9M7.5 15.5h7"/><path d="m7.8 8.1 1 1 2-2"/>',
  location:'<path d="M12 21c5-5.6 7-9 7-12.1a7 7 0 0 0-14 0C5 12 7 15.4 12 21Z"/><path d="M8.7 9h6.6M8.7 12h6.6M8.7 9v3M15.3 9v3"/>',
  hours:'<circle cx="12" cy="12" r="9"/><path d="M12 6v6l4 2"/><path d="M12 2v1.7M12 20.3V22M2 12h1.7M20.3 12H22"/>'
 };
 return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">'+paths[kind]+'</svg>';
}
function contactCards(){return '<section class="contact-section" aria-labelledby="academyContactHeading"><div class="container"><span class="eyebrow">STAY CONNECTED</span><h2 id="academyContactHeading">Speak with our Academy</h2><p class="section-lead">Admissions, visits and academy information — we are here to help.</p><div class="contact-grid">'+
 '<article class="contact-card"><span class="circle">'+academyContactIcon('call')+'</span><h3>Speak to Us</h3><p>Call our Academy office</p><div class="contact-card-detail phone-pair">'+tel+'<span class="contact-number-divider"> · </span>'+telAlt+'</div></article>'+
 '<article class="contact-card"><span class="circle">'+academyContactIcon('admissions')+'</span><h3>Admission Enquiries</h3><p>Questions about joining the Academy?</p><a class="contact-card-action" data-route href="/admission">Enquire about admission ↗</a></article>'+
 '<article class="contact-card"><span class="circle">'+academyContactIcon('location')+'</span><h3>Our Address</h3><p>Find us in Ernakulam</p><strong id="academyContactAddressDisplay" class="contact-card-detail">'+esc(school.area)+'</strong><a class="contact-card-action" href="https://maps.app.goo.gl/Gj9mgHHR7gRG4MiQ6" target="_blank" rel="noopener noreferrer">Get directions ↗</a></article>'+
 '<article class="contact-card"><span class="circle">'+academyContactIcon('hours')+'</span><h3>Office Hours</h3><p>Contact availability</p><strong id="academyContactHoursDisplay" class="contact-card-detail">8:30 AM – 9:00 PM</strong></article>'+
 '</div></div></section>';}

function scholarFeature(origin='home'){return `<section class="scholar-section scholar-section-${origin} scholar-editorial-v97" aria-labelledby="scholar-title-${origin}"><div class="container"><div class="scholar-spotlight scholar-editorial-layout-v97"><div class="scholar-visual"><div class="scholar-photo-shell-v97"><span class="scholar-white-lines-v97" aria-hidden="true"></span><img src="/assets/shamsul-ulama-portrait-main.jpg" alt="Original portrait of Shaikhuna Shamsul Ulama E. K. Aboobacker Musliyar" loading="lazy" decoding="async"></div><span class="scholar-photo-label">A LEGACY OF SACRED KNOWLEDGE</span></div><div class="scholar-copy"><span class="scholar-eyebrow">OUR GUIDING LIGHT</span><span class="scholar-dates-v97">1914 <span aria-hidden="true">—</span> 1996</span><h2 id="scholar-title-${origin}">Shaikhuna Shamsul Ulama <em>E. K. Aboobacker Musliyar</em> <span lang="ar" dir="rtl" class="scholar-rahma">رَحِمَهُ اللّٰهُ تَعَالَى</span></h2><p class="scholar-descriptor">A Distinguished Scholar &amp; An Inspiring Legacy</p><span class="scholar-rule" aria-hidden="true"></span><p class="scholar-excerpt">His lifelong devotion to Islamic knowledge, education and spiritual character continues to inspire the mission of our Academy.</p><a class="scholar-discover scholar-more-v97" href="/shamsul-ulama-legacy" data-route aria-label="More about the life and legacy of Shaikhuna Shamsul Ulama">More <span aria-hidden="true">↗</span></a></div><span class="scholar-curve-v97" aria-hidden="true"></span></div></div></section>`;}
function scholarArticle(){return `<div class="scholar-article-page"><section class="scholar-article-intro"><div class="container"><a href="/about" data-route class="scholar-back">← Back to About the Academy</a><span class="scholar-eyebrow">THE SCHOLAR BEHIND OUR INSPIRATION · 1914—1996</span><h1>Shamsul Ulama <em>E. K. Aboobacker Musliyar</em> <span lang="ar">رحمه الله</span></h1><p>A Beacon of Islamic Scholarship, Spiritual Wisdom, and Lasting Legacy</p></div></section><section class="scholar-story"><div class="container scholar-story-grid"><div class="scholar-story-portrait"><img src="/assets/shamsul-ulama-portrait-legacy.jpg" alt="Historic photograph of Shamsul Ulama E. K. Aboobacker Musliyar seated with glasses in hand" loading="eager"><p>Shamsul Ulama E. K. Aboobacker Musliyar (RA)<br><span>1914 — 19 August 1996</span></p></div><article class="scholar-story-prose"><div class="story-section-label">A LIFE DEDICATED TO KNOWLEDGE</div><p>In the rich heritage of Islamic scholarship in Kerala, the name of <strong>Shamsul Ulama E.K. Aboobacker Musliyar (Rahimahullah)</strong> occupies a distinguished place. His life was devoted to the pursuit of sacred knowledge, the transmission of Islamic learning, and the advancement of religious education. Born in 1914 in Parambil Kadavu, Kozhikode, Kerala, he embarked on a lifelong journey of learning under distinguished scholars. His advanced studies at Baqiyat Salihath in Vellore laid an important foundation for his scholarly career, and his subsequent service as a teacher reflected his dedication to imparting knowledge to future generations.</p><p>His contributions extended far beyond personal scholarship. He served as Principal of Jamia Nooriya Arabic College, Pattikkad, and Darussalam Arabic College, Nandi, playing an important role in the development of Islamic education. In 1957, he became the General Secretary of Samastha Kerala Jam'iyyathul Ulama, a position he held for decades. Through teaching, scholarly writing, public addresses, and religious leadership, he made lasting contributions to the preservation and transmission of Islamic knowledge in Kerala. His passing on 19 August 1996 marked the end of an extraordinary life of service, yet the significance of his scholarly legacy continues to inspire generations.</p><p>The greatness of a scholar is measured not merely by the positions he holds or the breadth of his knowledge, but also by the enduring value of the legacy he leaves behind. Shamsul Ulama's life reminds us that <strong>sacred knowledge is an amanah—a trust that must be preserved, practised, and passed on with sincerity, humility, and responsibility.</strong> His scholarly journey stands as a reminder that the pursuit of knowledge must be accompanied by <em>Adab</em>, that learning must cultivate character, and that scholarship finds its highest purpose in serving the Deen and benefiting humanity.</p><h2>A Legacy That Inspires Our Academy</h2><p>For <strong>Shamsul Ulama Islamic Academy</strong>, the life and legacy of this eminent scholar carry a profound significance. His dedication to knowledge and religious education reflects the very ideals that an Islamic educational institution should strive to uphold. Our Academy aspires to be more than a place of learning; it seeks to be a nurturing ground where knowledge is deepened, character is refined, spiritual consciousness is strengthened, and a lasting commitment to the service of Islam is cultivated.</p><p>Inspired by the scholarly heritage of Shamsul Ulama, our vision is to nurture a generation of students who unite intellectual excellence with noble character, sound scholarship with humility, and religious understanding with a sincere sense of responsibility towards society. We aspire to prepare individuals who will carry the light of knowledge beyond the walls of the Academy and illuminate the lives of others through their conduct, wisdom, and service.</p><blockquote>The true honour of a scholarly legacy lies not merely in remembering the name of a great scholar, but in embodying the values for which he devoted his life.</blockquote><p>May the heritage of Islamic scholarship that he represents continue to inspire our Academy, strengthen its educational mission, and guide its students towards a life of knowledge, <em>Adab</em>, sincerity, and spiritual excellence.</p><h2>A Prayer for Blessings and Guidance</h2><p>May Allah accept the devoted service of Shamsul Ulama E.K. Aboobacker Musliyar (Rahimahullah), envelop him in His infinite mercy, and grant him the highest ranks in Jannatul Firdaus.</p><p>May the light of knowledge he helped illuminate flourish within our hearts as <em>Adab</em>, <em>Ikhlas</em>, and <em>Taqwa</em>, and may <strong>Shamsul Ulama Islamic Academy</strong> rise as a distinguished beacon of Islamic scholarship and spiritual leadership.</p><p>May Allah bless our Academy with enduring goodness, guide its students and teachers towards sincere service of the Deen, and make its legacy a source of benefit for generations to come. <strong>Ameen.</strong></p><a class="scholar-story-cta" href="/about" data-route>← About Our Academy</a></article></div></section></div>`;}

function learnerFeature(){return '<section class="learning-home hifz-signature-v69" aria-labelledby="learning-home-title"><div class="container learning-home-grid"><figure class="learning-home-art"><div class="hifz-arched-frame"><div class="hifz-arch-outline"><div class="hifz-arch-recess"><img class="hifz-boy-animated" src="/assets/hifz-boy-academy.webp" alt="Smiling Hifz student holding a Qur’an" width="225" height="285" loading="lazy"></div></div></div><figcaption>Every page is a step towards knowledge.</figcaption></figure><div class="learning-home-copy"><span class="eyebrow">OUR HIFZ &amp; ACADEMIC JOURNEY</span><h2 id="learning-home-title">Each step in learning matters.</h2><p>With care from dedicated Usthads, students learn, revise and grow with purpose. Enrolled learners and their parents can follow published progress in their own secure dashboards.</p><div class="hifz-portal-list" aria-label="Hifz Journey pathways"><div class="hifz-portal-row"><span class="hifz-portal-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="11" cy="6.5" r="3"/><path d="M5 19c.3-4 2.3-6 6-6 1.6 0 2.8.4 3.7 1.2M16 17l2.1 2 3.4-4"/></svg></span><strong>Personal Mentorship</strong><div class="hifz-portal-actions"><a class="hifz-signin" href="/login?next=/dashboard">Sign In</a><a class="hifz-learn-link" data-route href="/about">Our Learning Approach <span aria-hidden="true">↗</span></a></div></div><div class="hifz-portal-row"><span class="hifz-portal-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="9" cy="7" r="2.8"/><circle cx="17.5" cy="9" r="2.2"/><path d="M3.7 19v-1.5c0-3.1 2-4.9 5.3-4.9s5.3 1.8 5.3 4.9V19M16.3 14.1c2.7 0 4.1 1.6 4.1 4.2V19"/></svg></span><strong>Parent Progress Portal</strong><div class="hifz-portal-actions"><a class="hifz-signin" href="/login?next=/dashboard">Sign In</a><a class="hifz-learn-link" data-route href="/about">Our Learning Approach <span aria-hidden="true">↗</span></a></div></div></div><p class="learning-home-note">Private reports and teacher feedback are visible only to authorised family accounts.</p></div></div></section>';}

function academyHomeShowcaseMarkup(){
 return `<section class="home-gallery-section academy-reveal-region" aria-labelledby="academy-home-gallery-title">
  <div class="container">
   <div class="home-gallery-heading reveal-on-scroll"><div><span class="eyebrow">ACADEMY MOMENTS</span><h2 id="academy-home-gallery-title">Our Photo &amp; Video Gallery</h2><p>Moments of learning, community and achievement from our Academy.</p></div><a href="/gallery" data-route class="home-gallery-more">Explore Gallery <span aria-hidden="true">↗</span></a></div>
   <div id="academyHomeGallery" class="home-gallery-grid" aria-live="polite"><p class="showcase-loading">Loading Academy gallery…</p></div>
  </div>
 </section>
`;
}

function home(){return `<section class="academy-video-hero" aria-label="Shamsul Ulama Islamic Academy welcome video and photo"><img id="academyHomeFallback" alt="Preview of the currently selected Academy video" fetchpriority="high" decoding="async" hidden><video id="academyHomeVideo" muted autoplay loop playsinline preload="auto" aria-label="Academy welcome video" hidden></video><iframe id="academyHomeEmbed" title="Academy welcome video" allow="autoplay; encrypted-media; picture-in-picture" referrerpolicy="strict-origin-when-cross-origin" hidden></iframe><div class="academy-video-hero-shade" aria-hidden="true"></div><button id="academyHeroPlayButton" class="academy-video-play-action" type="button" hidden aria-label="Play selected Academy welcome video">▶ Play Academy Video</button><p id="academyHomePlaybackStatus" class="academy-home-playback-status" role="status" hidden></p><a class="academy-hero-scroll" href="#academyProfile" aria-label="Scroll to Academy introduction">↓</a></section><div id="academyProfile"></div>`+scholarFeature('home')+'<section class="hero academy-home-intro academy-heritage-continuation-v98" aria-labelledby="academy-intro-title"><div class="container hero-grid"><div class="hero-copy"><span class="eyebrow">SHAMSUL ULAMA ISLAMIC ACADEMY · PERIGHALA</span><div class="academy-intro-layout-v98"><h2 id="academy-intro-title" class="purpose-heading">Rooted in the Qur’an.<br><em>Growing with purpose.</em></h2><div class="academy-intro-side-v98"><p>A thoughtful space for Qur’an memorisation, Islamic education, and the journey of becoming a Hafiz.</p><div class="actions"><a class="pill" data-route href="/about">Explore Our Academy ↗</a><a class="pill ghost" data-route href="/admission">Admission Enquiry</a></div><p class="location-line">Perighala · Ernakulam · Kerala</p></div></div></div></div></section>'+academyHomeShowcaseMarkup()+
'<section class="section white academy-home-about-v102" aria-labelledby="academy-home-about-title"><div class="container about-grid"><div class="academy-about-editorial-v102"><div class="academy-about-lead-v102"><span class="eyebrow">ABOUT THE ACADEMY</span><h2 id="academy-home-about-title">A centre for Qur’an &amp; character.</h2></div><div class="academy-about-description-v102"><p>Shamsul Ulama Islamic Academy is located in Perighala, Ernakulam, Kerala. This website shares official academy information, admissions and contact details.</p><p>Learn about the academy, our approach to learning and the plans for students and their families.</p><a data-route id="academyAboutKnowMore" class="pill ghost" href="/about">Know More About Us <span aria-hidden="true">↗</span></a></div></div><figure class="academy-approved-about-photo" style="margin:0" hidden><img class="about-image" data-media-slot="about_quran" alt="Official Academy learning photograph" hidden></figure></div></section>'+
'<section class="verse"><div class="container"><div class="arabic" lang="ar">وَلَقَدْ يَسَّرْنَا الْقُرْآنَ لِلذِّكْرِ فَهَلْ مِن مُّدَّكِرٍ</div><p>“And We have certainly made the Qur’an easy for remembrance, so is there any who will remember?”</p><small>Surah Al-Qamar (54:17)</small></div></section>'+
learnerFeature()+
'<section class="section white"><div class="container" id="publicAchievements" hidden><span class="eyebrow">OUR ACHIEVEMENTS</span><h2>Verified Academy Milestones</h2><div class="achievement-grid" id="achievementFigures"></div></div></section>'+
window.AcademyCollegeFeatures.home()+window.AcademyLearning.home()}
function pageHeading(over,title,desc){return '<section class="heading"><div class="container"><span class="eyebrow">'+over+'</span><h1>'+title+'</h1><p>'+desc+'</p></div></section>'}
function about(){return pageHeading('ABOUT THE ACADEMY','A place to learn.<br>A journey to grow.','Shamsul Ulama Islamic Academy · Perighala, Ernakulam, Kerala')+'<section class="section white"><div class="container about-grid"><div><span class="eyebrow">WHO WE ARE</span><h2>Qur’an education, with care and intention.</h2><p>Shamsul Ulama Islamic Academy is an Islamic educational institution in Perighala, Ernakulam, Kerala. It is affiliated with Jamia Jalaliyya, located in Mundakkulam, Malappuram, Kerala.</p><p>A centre dedicated to Qur’an memorisation and Islamic education.</p><p id="aboutIntro">An institution nurturing knowledge and character.</p><p id="aboutVision">Our vision is purposeful learning and good character.</p><p><a class="affiliation-link" href="https://jamiajalaliyya.com/" target="_blank" rel="noopener noreferrer">Our Academic Affiliation · Jamia Jalaliyya official website ↗</a></p><p class="status">The academy encourages steady Qur’an learning, good character and respectful guidance throughout each educational journey.</p></div><figure class="academy-approved-about-photo" style="margin:0" hidden><img class="about-image" data-academy-photo="hero" alt="Official Academy photograph" hidden></figure></div></section>'+scholarFeature('about')+'<section class="section soft"><div class="container"><h2>Academy Address</h2><p id="aboutAddress">'+school.area+'</p><h3>Affiliation</h3><p id="aboutAffiliation">'+esc(school.affiliation)+' — '+esc(school.affiliationLocation)+'</p><p><a id="aboutMapLink" href="https://maps.app.goo.gl/Gj9mgHHR7gRG4MiQ6" target="_blank" rel="noopener noreferrer">View Academy Location on Google Maps ↗</a></p></div></section>'}
function gallery(){return pageHeading('GALLERY','Academy Gallery.','Official academy photographs approved for publication.')+'<section class="section white"><div class="container"><p id="galleryStatus" class="status">Loading official academy photographs…</p><div id="publicGallery" class="gallery"></div></div></section>'}
function admission(){return pageHeading('ADMISSION','Begin your journey with us.','Official academy admission application and review.')+"<section class=\"section white\"><div class=\"container admission-wrapper\">\n<div class=\"admission-introduction\"><span class=\"eyebrow\">OFFICIAL APPLICATION</span><h2>Admission Application Form</h2><p>Complete the student's details and guardian contact information. The Academy will review the saved application and contact you about the next steps.</p></div>\n<form id=\"admissionEnquiry\" class=\"card admission-full-form\">\n<h3>01. Student Information</h3>\n<div class=\"admission-form-grid\">\n<div class=\"field\"><label for=\"studentName\">Student Full Name <span aria-hidden=\"true\">*</span></label><input id=\"studentName\" name=\"student_name\" required minlength=\"2\" maxlength=\"140\" autocomplete=\"name\"></div>\n<div class=\"field\"><label for=\"studentDob\">Date of Birth</label><input id=\"studentDob\" name=\"date_of_birth\" type=\"date\"></div>\n<div class=\"field\"><label for=\"studentClass\">Present Class</label><input id=\"studentClass\" name=\"current_class\" maxlength=\"100\"></div>\n<div class=\"field\"><label for=\"studentSchool\">School / Madrasa</label><input id=\"studentSchool\" name=\"school_or_madrasa\" maxlength=\"160\"></div></div>\n<div class=\"field\"><label for=\"studentHifz\">Previous Qur’an / Hifz Learning</label><textarea name=\"prior_hifz\" id=\"studentHifz\" rows=\"3\" maxlength=\"700\" placeholder=\"Previously completed Surahs, Juz, or learning experience (optional)\"></textarea></div>\n<h3>02. Parent / Guardian Information</h3>\n<div class=\"admission-form-grid\">\n<div class=\"field\"><label for=\"guardianName\">Guardian Full Name <span aria-hidden=\"true\">*</span></label><input id=\"guardianName\" name=\"guardian_name\" required minlength=\"2\" maxlength=\"140\"></div>\n<div class=\"field\"><label for=\"guardianRelation\">Relationship</label><select id=\"guardianRelation\" name=\"guardian_relationship\"><option value=\"Parent\">Parent</option><option value=\"Father\">Father</option><option value=\"Mother\">Mother</option><option value=\"Guardian\">Other Guardian</option></select></div>\n<div class=\"field\"><label for=\"guardianPhone\">Phone Number <span aria-hidden=\"true\">*</span></label><input id=\"guardianPhone\" name=\"guardian_phone\" type=\"tel\" required minlength=\"9\" maxlength=\"25\" autocomplete=\"tel\"></div>\n<div class=\"field\"><label for=\"alternatePhone\">Additional Phone (optional)</label><input id=\"alternatePhone\" name=\"alternative_phone\" type=\"tel\" maxlength=\"25\"></div>\n<div class=\"field\"><label for=\"guardianEmail\">Email (optional)</label><input id=\"guardianEmail\" name=\"email\" type=\"email\" maxlength=\"160\"></div>\n<div class=\"field\"><label for=\"guardianDistrict\">District</label><input id=\"guardianDistrict\" name=\"district\" maxlength=\"150\"></div>\n</div>\n<div class=\"field\"><label for=\"studentAddress\">Full Postal Address <span aria-hidden=\"true\">*</span></label><textarea id=\"studentAddress\" name=\"address\" rows=\"3\" required minlength=\"8\" maxlength=\"1000\"></textarea></div>\n<div class=\"admission-form-grid\">\n<div class=\"field\"><label for=\"studentLocality\">Locality</label><input id=\"studentLocality\" name=\"locality\" maxlength=\"150\"></div>\n<div class=\"field\"><label for=\"studentPincode\">PIN Code</label><input id=\"studentPincode\" name=\"postal_code\" inputmode=\"numeric\" maxlength=\"12\"></div>\n</div>\n<h3>03. Additional Information</h3><div class=\"field\"><label for=\"enquiryNotes\">Notes for Admission Office</label><textarea id=\"enquiryNotes\" name=\"notes\" rows=\"3\" maxlength=\"1200\"></textarea></div>\n<div class=\"admission-trap\" aria-hidden=\"true\"><label for=\"extraWebsite\">Website</label><input id=\"extraWebsite\" name=\"website\" tabindex=\"-1\" autocomplete=\"off\"></div>\n<label class=\"enquiry-consent\"><input id=\"consent\" name=\"consent\" type=\"checkbox\" required> I confirm these details are correct and consent to being contacted by the Academy regarding admission.</label>\n<button class=\"pill\" type=\"submit\">Submit Official Application</button>\n<p id=\"enquiryMessage\" role=\"status\" aria-live=\"polite\"></p>\n<div id=\"applicationReceipt\" class=\"admission-receipt\" hidden aria-live=\"polite\"></div>\n</form><p class=\"admission-privacy\">For enquiries: Contact the Academy. Submission is not automatic admission. Only authorised Usthads can review personal application details.</p>\n</div></section>"+contactCards()}
function contact(){return '<div class="academy-contact-page">'+contactCards()+'<section class="academy-contact-visit" aria-labelledby="academyVisitHeading"><div class="container"><div class="academy-contact-visit-head"><span class="eyebrow">FIND US</span><h2 id="academyVisitHeading">Visit Shamsul Ulama Islamic Academy</h2><p id="contactInfoAddress">'+school.area+'</p></div><div class="academy-contact-map-card"><div class="academy-contact-map-window"><div id="academyMap" class="academy-map"></div></div><div class="academy-contact-map-aside"><span class="academy-contact-map-label">OUR LOCATION</span><h3>Plan your visit</h3><p>Perighala, Ernakulam, Kerala, India</p><a id="academyMapLink" href="https://maps.app.goo.gl/Gj9mgHHR7gRG4MiQ6" target="_blank" rel="noopener noreferrer" class="academy-contact-directions">Open Google Maps <span aria-hidden="true">↗</span></a></div></div></div></section></div>';}
function programmes(){return window.AcademyLearning.hub();}
function programmeEssay(id){return window.AcademyLearning.essay(id);}
function collegeFeatures(){return window.AcademyCollegeFeatures.hub();}
function collegeFeatureEducation(){return window.AcademyCollegeFeatures.essay('01');}
function collegeFeatureMethod(){return window.AcademyCollegeFeatures.essay('02');}
function collegeFeatureTeachers(){return window.AcademyCollegeFeatures.essay('03');}
function collegeFeatureFacilities(){return window.AcademyCollegeFeatures.essay('04');}
const pages={'/college-features':collegeFeatures,'/college-features/islamic-academic-education':collegeFeatureEducation,'/college-features/our-teaching-method':collegeFeatureMethod,'/college-features/dedicated-teachers-service':collegeFeatureTeachers,'/college-features/student-facilities':collegeFeatureFacilities,'/shamsul-ulama-legacy':scholarArticle,'/':home,'/programmes':programmes,'/programmes/school':()=>programmeEssay('school'),'/programmes/tuition':()=>programmeEssay('tuition'),'/programmes/balance':()=>programmeEssay('balance'),'/programmes/habits':()=>programmeEssay('habits'),'/about':about,'/gallery':gallery,'/admission':admission,'/contact':contact};

const academyWelcomeMessages=[
 'a world of knowledge.',
 'a journey inspired by the Qur’an.',
 'a place where young minds grow.',
 'a future shaped by learning.',
 'an Academy that nurtures every student.'
];
let academyWelcomeTimer=0;
function animateAcademyWelcome(){
 if(academyWelcomeTimer){clearTimeout(academyWelcomeTimer);academyWelcomeTimer=0;}
 const el=document.getElementById('academyWelcomeType');
 if(!el)return;
 if(window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches){
  el.textContent=academyWelcomeMessages[0];return;
 }
 let index=0,position=0,erasing=false;
 el.textContent='';
 function tick(){
  if(!el.isConnected){academyWelcomeTimer=0;return;}
  const sentence=academyWelcomeMessages[index];
  if(!erasing){
   position=Math.min(position+1,sentence.length);
   el.textContent=sentence.slice(0,position);
   if(position===sentence.length){
    erasing=true;
    academyWelcomeTimer=setTimeout(tick,1800);
   }else academyWelcomeTimer=setTimeout(tick,sentence[position-1]===' '?105:58);
  }else{
   position=Math.max(0,position-1);
   el.textContent=sentence.slice(0,position);
   if(position===0){
    index=(index+1)%academyWelcomeMessages.length;
    erasing=false;
    academyWelcomeTimer=setTimeout(tick,320);
   }else academyWelcomeTimer=setTimeout(tick,29);
  }
 }
 academyWelcomeTimer=setTimeout(tick,400);
}
function render(){const path=location.pathname.replace(/\/$/,'')||'/';if(path==='/hifz-planner'||path==='/student-portal'){location.replace('/login?next=/dashboard');return;}const content=(pages[path]||function(){return pageHeading('NOT FOUND','Page not found.','Choose a page from the main navigation.')+'<section class="section"><div class="container"><a data-route class="pill" href="/">Return Home</a></div></section>'})();
document.title=(path==='/'?'Home':path.slice(1).replaceAll('-',' ').replace(/\b\w/g,c=>c.toUpperCase()))+' | Shamsul Ulama Islamic Academy';
app.innerHTML=header(path)+'<main id="main">'+content+'</main>'+footer();animateAcademyWelcome();window.AcademyLearning.bind();window.dispatchEvent(new CustomEvent('academy:render',{detail:{path}}));
document.querySelector('#mobileMenu')?.addEventListener('click',()=>{const nav=document.querySelector('#nav'),open=nav.classList.toggle('open');document.querySelector('#mobileMenu').setAttribute('aria-expanded',String(open));});
}
function goToPageAnchor(){
 if(!location.hash){window.scrollTo(0,0);return;}
 const id=decodeURIComponent(location.hash.slice(1));
 const target=document.getElementById(id);
 if(target)target.scrollIntoView({behavior:'smooth',block:'start'});
 else window.scrollTo(0,0);
}
document.addEventListener('click',e=>{
 const link=e.target.closest('a[data-route]');
 if(!link||e.metaKey||e.ctrlKey||e.shiftKey||e.altKey)return;
 const u=new URL(link.href);
 if(u.origin!==location.origin)return;
 e.preventDefault();
 const destination=u.pathname+u.search+u.hash;
 if(destination!==location.pathname+location.search+location.hash){
  const changed=u.pathname!==location.pathname;
  history.pushState({},'',destination);
  if(changed)render();
  goToPageAnchor();
 }else document.querySelector('#nav')?.classList.remove('open');
});
window.addEventListener('popstate',()=>{render();goToPageAnchor();});
render();
if(location.hash)setTimeout(goToPageAnchor,50);
})();