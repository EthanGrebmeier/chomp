# Surface spacing and navigation

Choose spacing by purpose, independently of how a screen is presented.
Use `SurfaceContent` for padded sections and `SheetContent` for sheet sections.
`SURFACE_INSETS` defines standard (16pt) and wide (32pt) gutters. NativeWind
`px-4` and `px-8` are equivalent for scroll content and individual list rows.
Do not add both container padding and row padding to the same edge.

| Surface         | Gutter         | Examples                                                                   |
| --------------- | -------------- | -------------------------------------------------------------------------- |
| Dense browsing  | Standard, 16pt | Grocery list, recipe library, meal planner, purchased history, list picker |
| Reading details | Wide, 32pt     | Recipe detail and recipe preview                                           |
| Focused forms   | Wide, 32pt     | Recipe create/edit/import, authentication, item editors                    |
| Settings        | Wide, 32pt     | Root menu, account, saved items, stores, categories                        |
| Sheet workflows | Wide, 32pt     | Item composer, recipe ingredients, conflict review                         |

## Navigation intent

- `BackButton` always renders a chevron. Use it for a parent screen or earlier
  workflow step: recipe pages, Settings submenus, ingredient selection, and
  conflict review returning to its overview or composer.
- `CloseButton` always renders an X. Use it for dismissing/cancelling a surface:
  root Settings, item/quantity editors, pickers, standalone conflict review,
  and modal recipe previews.
- A modal presentation alone does not imply an X: a Settings submenu still
  returns to Settings. Preserve existing handlers and any pending-edit guards.
- Shared content used both as a page and a modal must receive the exit intent
  from its host. Recipe detail uses its explicit `onClose` callback for previews;
  store review uses `exitAction`.
- Leading actions align their icon box with the content edge while retaining
  a 44pt touch target. Do not add per-screen negative margins or translate icons.

## Vertical spacing and ownership

- Full-screen page navigation starts 8pt below the safe area. The page host owns
  this inset once; recipe routes inherit it from their layout.
- Sheets and compact composers start 24pt below their surface boundary.
- Stacked headers have 8pt between actions and title, then 16pt before content.
- Recipe reading sections use 24pt separation; navigation-to-content is 8pt.
- Bottom action areas match the content gutter, with 16pt above actions and
  24pt plus the bottom safe area below. Keyboard-aware footers retain their
  keyboard avoidance behavior.
- The native/page host owns top safe area. `SheetBody` or `SheetFooter` owns
  bottom safe area, never both. New native surfaces reset the content context
  with `SurfaceContentRoot` (also exported as `SheetContentRoot`).

## Intentional exceptions

Card and input internal padding, chips, row gaps, centered branding, and compact
composer margins outside the card are not screen gutters. They can be smaller.
Metabars and swipeable rows may bleed into the gutter, but their resting content
must align with the surrounding heading. Loading, empty, and error states use
the same gutter as their parent surface. Authentication branding may keep its
own vertical composition while the form content uses the wide gutter.

## Verification

Check both recipe page and modal preview; Settings root and submenus; recipe
selection → ingredients → conflict overview → individual conflict → back;
create/edit/import forms; and loading/empty states. Verify icon/content alignment,
unchanged exit behavior, centered selectors, scrolling and keyboard footers.
