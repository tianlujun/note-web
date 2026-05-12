## 1. Modify ContentArea Component

- [x] 1.1 Replace dangerouslySetInnerHTML div with iframe element in content-area.tsx
- [x] 1.2 Add iframe with sandbox="allow-scripts allow-top-navigation-by-user-activation"
- [x] 1.3 Add ref to iframe element

## 2. Implement srcdoc Injection

- [x] 2.1 Create injected script string with postMessage link interception
- [x] 2.2 Concatenate script + HTML content for srcdoc
- [x] 2.3 Set iframe.srcdoc in useEffect when content changes

## 3. Add postMessage Listener

- [x] 3.1 Add window.addEventListener('message') in ContentArea
- [x] 3.2 Validate event.origin (optional for local notes)
- [x] 3.3 Parse { type: 'note-link', path } messages
- [x] 3.4 Call useTabStore.openTab() for internal links

## 4. Remove Old Code

- [x] 4.1 Remove stripBodyStyles function (no longer needed)
- [x] 4.2 Remove prose Tailwind classes from old div wrapper
- [x] 4.3 Remove onClick handler from old div (link interception now in iframe)

## 5. Verify and Test

- [ ] 5.1 Test rendering HTML note with embedded CSS (e.g., _index.html)
- [ ] 5.2 Test internal link navigation (click link opens new tab)
- [ ] 5.3 Test external link opens in new tab
- [ ] 5.4 Verify loading and error states still work
