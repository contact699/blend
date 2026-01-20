# Migration from Vibecode to Standard Expo

This guide helps you migrate from Vibecode to standard Expo development workflow.

---

## ✅ What Was Removed

### 1. **@vibecodeapp/sdk Package**
- Removed from `package.json`
- No longer needed for development

### 2. **Vibecode Metro Wrapper**
- Removed `withVibecodeMetro()` from `metro.config.js`
- Now using standard `react-native-svg-transformer` directly

### 3. **Environment Variable Prefixes**
- Changed: `EXPO_PUBLIC_VIBECODE_OPENAI_API_KEY`
- To: `EXPO_PUBLIC_OPENAI_API_KEY`

### 4. **Documentation References**
- Updated CLAUDE.md
- Updated SECURITY.md
- Updated SUPABASE-SETUP.md
- Removed all mentions of Vibecode App UI

---

## 🔧 Required Actions

### Step 1: Update Dependencies
```bash
bun install
```

This will:
- Remove @vibecodeapp/sdk
- Update bun.lock
- Install all other dependencies

### Step 2: Update Environment Variables (if you have AI API keys)

**Old (.env):**
```env
EXPO_PUBLIC_VIBECODE_OPENAI_API_KEY=sk-...
EXPO_PUBLIC_VIBECODE_ANTHROPIC_API_KEY=sk-...
```

**New (.env):**
```env
EXPO_PUBLIC_OPENAI_API_KEY=sk-...
EXPO_PUBLIC_ANTHROPIC_API_KEY=sk-...
```

**If you don't use AI features:** No action needed.

### Step 3: Restart Development Server
```bash
# Kill existing server (Ctrl+C)
bun start
```

---

## 📱 Development Workflow Changes

### Before (Vibecode)
- Managed git and dev server
- ENV tab for environment variables
- LOGS tab for viewing logs
- IMAGES tab for image management
- Limited terminal access

### After (Standard Expo)
- Full git control
- Edit `.env` file directly
- View logs in terminal/Metro bundler
- Use standard image tools
- Full terminal access

---

## 🧪 Testing

After migration, test these features:

### ✅ Core Features
- [ ] App starts without errors
- [ ] SVG icons display correctly
- [ ] NativeWind styles work
- [ ] Navigation works

### ✅ Development Tools
- [ ] Hot reload works
- [ ] Metro bundler runs
- [ ] TypeScript compilation works
- [ ] Console.log visible in terminal

---

## 🚀 New Capabilities

You now have access to:

1. **Full Git Control**
   ```bash
   git status
   git commit -m "your message"
   git push origin your-branch
   ```

2. **EAS Build & Submit**
   ```bash
   eas build:configure
   eas build --platform ios
   eas build --platform android
   eas submit
   ```

3. **Standard Expo CLI**
   ```bash
   npx expo start
   npx expo run:ios
   npx expo run:android
   npx expo install package-name
   ```

4. **Debugging Tools**
   - React DevTools
   - Expo DevTools
   - Chrome DevTools
   - Flipper (optional)

---

## 🐛 Troubleshooting

### Issue: "Module not found: @vibecodeapp/sdk"
**Fix:** Run `bun install` to remove the old package

### Issue: SVGs not rendering
**Fix:** Make sure `react-native-svg-transformer` is in devDependencies
```bash
bun add -d react-native-svg-transformer
```

### Issue: Environment variables not working
**Fix:**
1. Create `.env` file (copy from `.env.example`)
2. Remove `VIBECODE_` prefix from variable names
3. Restart dev server

### Issue: Metro bundler errors
**Fix:**
```bash
# Clear cache and restart
bun start --clear
```

---

## 📚 Resources

- [Expo Documentation](https://docs.expo.dev/)
- [React Native Documentation](https://reactnative.dev/)
- [EAS Build](https://docs.expo.dev/build/introduction/)
- [EAS Submit](https://docs.expo.dev/submit/introduction/)

---

## 💡 Benefits of Standard Workflow

1. **More Control** - Full access to all tools and configurations
2. **Better Debugging** - Use industry-standard debugging tools
3. **Standard Practices** - Follows official Expo documentation
4. **Community Support** - Easier to get help from Expo community
5. **CI/CD Integration** - Works with GitHub Actions, CircleCI, etc.

---

## ✨ No Breaking Changes to App Code

**Important:** Your app code (`src/` directory) was **NOT affected**.

All changes were to:
- Build configuration (metro.config.js)
- Dependencies (package.json)
- Documentation files
- Environment variable naming conventions

Your features, components, and logic remain unchanged!

---

## 🎉 Migration Complete

You're now using the standard Expo SDK 53 + React Native 0.79 workflow!

Next steps:
1. Run `bun install`
2. Update `.env` if using AI keys
3. Run `bun start`
4. Test your app

Everything should work exactly the same, but now with full development control.
