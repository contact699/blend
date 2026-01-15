# Blend - App Store Submission Checklist

## 📱 Apple App Store (iOS)

### App Information
- [ ] App Name: **Blend** (check availability)
- [ ] Subtitle: "Ethical Non-Monogamy Dating"
- [ ] Category: Primary - Lifestyle, Secondary - Social Networking
- [ ] Age Rating: 17+ (dating app with mature themes)
- [ ] Privacy Policy URL: https://blendapp.com/privacy
- [ ] Terms of Service URL: https://blendapp.com/terms
- [ ] Support URL: https://blendapp.com/support
- [ ] Marketing URL: https://blendapp.com

### Required Assets
- [ ] App Icon (1024x1024 PNG, no alpha)
- [ ] Screenshots (6.7" - iPhone 15 Pro Max: 1290 x 2796)
- [ ] Screenshots (6.5" - iPhone 14 Plus: 1284 x 2778)
- [ ] Screenshots (5.5" - iPhone 8 Plus: 1242 x 2208)
- [ ] iPad Screenshots (if supporting iPad)

### App Store Description
```
Blend - Dating designed for ethical non-monogamy.

Whether you're polyamorous, in an open relationship, or exploring ENM, Blend is the first dating app built specifically for you.

🌈 AUTHENTIC CONNECTIONS
• Link verified partners to show relationship transparency
• Polycule visualization to understand connection networks
• Trust scores based on community vouches

💬 THOUGHTFUL MATCHING
• Compatibility insights beyond just photos
• Relationship structure matching
• Boundary and communication preference alignment

🎮 FUN ICEBREAKERS
• Interactive games to spark conversations
• "36 Questions to Fall in Love"
• Truth or Dare, Two Truths & a Lie, and more

🔒 SAFETY FIRST
• Partner verification system
• Community trust vouching
• Comprehensive consent checklists
• STI safety resources

📚 EDUCATION & RESOURCES
• ENM 101 learning materials
• Communication guides
• Relationship agreement templates

Download Blend and find your people.
```

### Keywords (100 character limit)
```
polyamory,polyamorous,enm,open relationship,dating,ethical non-monogamy,poly dating,couples dating
```

### App Review Notes
```
This is a dating app for the ethical non-monogamy community. Users can:
- Create profiles with relationship structure info
- Link verified partners (with consent)
- Match and message other users
- Play icebreaker games

Test Account:
Email: review@blendapp.com
Password: [create test account]

Notes:
- Some content may reference multiple relationships - this is the app's core purpose
- All partner linking requires mutual consent
- Content moderation is active
```

---

## 🤖 Google Play Store (Android)

### App Information
- [ ] App Name: Blend - ENM Dating
- [ ] Short Description (80 chars): "Dating app for polyamory & ethical non-monogamy"
- [ ] Full Description (4000 chars): [Same as iOS]
- [ ] Category: Dating
- [ ] Content Rating: Mature 17+
- [ ] Privacy Policy URL: https://blendapp.com/privacy

### Required Assets
- [ ] App Icon (512x512 PNG)
- [ ] Feature Graphic (1024x500 PNG)
- [ ] Screenshots (phone): at least 2, up to 8
- [ ] Screenshots (7" tablet): optional
- [ ] Screenshots (10" tablet): optional

### Data Safety Form
- [ ] Data collected: Email, Name, Photos, Location, Messages
- [ ] Data shared: None with third parties
- [ ] Security practices: Data encrypted in transit, delete data option

---

## 🎨 Asset Specifications

### App Icon
- iOS: 1024x1024 PNG (no transparency, no rounded corners)
- Android: 512x512 PNG (can have transparency)
- Design: Simple, recognizable at small sizes
- Suggested: Abstract blend of colors, heart/connection motif

### Screenshots (Recommended Screens)
1. **Discover Feed** - "Find Your People"
2. **Match Screen** - "See Who's Interested"
3. **Partner Linking** - "Transparency Built In"
4. **Chat/Games** - "Break the Ice"
5. **Trust Profile** - "Community Verified"
6. **Polycule Map** - "Visualize Connections"

### Splash Screen
- Size: 1284x2778 (scale to fit)
- Design: Logo centered, brand colors
- Duration: Show during app load

---

## 📄 Legal Documents Needed

### Privacy Policy (Required)
Must cover:
- [ ] What data is collected (profile info, photos, location, messages)
- [ ] How data is used (matching, messaging, analytics)
- [ ] Third-party services (Supabase, Sentry, Expo)
- [ ] Data retention and deletion
- [ ] User rights (access, deletion, portability)
- [ ] Contact information
- [ ] GDPR compliance (if serving EU)
- [ ] CCPA compliance (if serving California)

### Terms of Service (Required)
Must cover:
- [ ] User eligibility (18+)
- [ ] Acceptable use policy
- [ ] Content ownership
- [ ] Account termination
- [ ] Limitation of liability
- [ ] Dispute resolution
- [ ] Updates to terms

### Community Guidelines
- [ ] Respectful behavior expectations
- [ ] Prohibited content
- [ ] Reporting process
- [ ] Enforcement actions

---

## 🚀 EAS Build Commands

```bash
# Install EAS CLI
npm install -g eas-cli

# Login to Expo
eas login

# Configure project
eas build:configure

# Build for iOS (requires Apple Developer account)
eas build --platform ios

# Build for Android
eas build --platform android

# Submit to stores
eas submit --platform ios
eas submit --platform android
```

---

## ✅ Pre-Submission Checklist

### Technical
- [ ] All TypeScript errors fixed
- [ ] All tests passing
- [ ] No console.log statements
- [ ] Production environment variables set
- [ ] Sentry DSN configured
- [ ] Push notification certificates

### Content
- [ ] App icon finalized
- [ ] Screenshots taken on device
- [ ] App description proofread
- [ ] Privacy policy published
- [ ] Terms of service published

### Accounts
- [ ] Apple Developer Program ($99/year)
- [ ] Google Play Developer ($25 one-time)
- [ ] EAS account configured
- [ ] Support email set up

---

## 📅 Timeline

| Task | Est. Time |
|------|-----------|
| Create app icon & splash | 2-4 hours |
| Take screenshots | 1-2 hours |
| Write privacy policy | 2-3 hours |
| Write terms of service | 2-3 hours |
| EAS build configuration | 1 hour |
| First iOS build | 30 min |
| First Android build | 30 min |
| Apple review | 1-7 days |
| Google review | 1-3 days |
