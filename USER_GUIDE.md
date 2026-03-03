# ATLAZ Fashion Search — User Guide

ATLAZ is an AI-powered fashion search engine that understands natural language. Instead of hunting through keyword filters and menus, you describe what you want the way you would to a friend — and the AI finds the closest matching products from thousands of brands and retailers. This guide walks through every feature of the site so you can get the most out of your searches.

---

## Getting Started

### What Makes ATLAZ Different

Traditional fashion search engines rely on keyword matching. If you search for "something flowy for a beach wedding," a keyword engine looks for products with those exact words in the title or tags — and usually returns nothing useful.

ATLAZ works differently. When you type a description, an AI reads your query and extracts the underlying intent: the silhouette you are describing (flowy), the occasion (beach wedding), the formality level (relaxed but elegant), and even implicit attributes like lightweight fabrics and warm-weather colors. It then searches using those attributes against a semantic index of the entire product catalog, finding items that *mean* the same thing as your description even if no product title contains your exact words.

The result is a search engine that feels like talking to a personal stylist rather than filtering a spreadsheet.

**[Screenshot: ATLAZ homepage showing the hero section with the search bar, tagline "Your fashion. Describe it. Discover it.", and example search pills at the bottom]**

> **Beyond Original Scope — AI-Powered Natural Language Understanding**
> Standard e-commerce search uses keyword matching against product titles and tags. ATLAZ uses a large language model (Anthropic Claude) to extract structured fashion intent from free-form English, then converts that intent into a high-dimensional vector embedding for semantic similarity search. This requires an LLM API integration, a prompt engineering layer, and a vector database (pgvector). **Typical build cost: $15,000–$30,000.**

---

### Creating an Account (Optional but Recommended)

You do not need an account to search, browse, or view products. However, creating a free account unlocks features that improve over time.

**To create an account:**

1. Click **Sign Up** in the top-right corner of the navigation bar.
2. You will see two options on the Sign Up page:
   - **Sign up with Google** — a single click that uses your existing Google account. No password needed. This is the fastest method.
   - **Email and password** — fill in your first name, last name, email address, and a password (minimum 8 characters), then click **Create Account**.
3. If you chose email/password sign-up, you will be redirected to a verification page. Check your email inbox for a verification link from ATLAZ and click it. You cannot sign in until your email is verified.
4. After verification, you will be redirected to the Sign In page with a green confirmation banner reading "Your email has been verified successfully!"

**[Screenshot: The Sign Up page showing both the Google sign-up button and the email/password form with First Name, Last Name, Email, and Password fields]**

**What changes when you are signed in vs. anonymous:**

| Feature | Anonymous Visitor | Signed-In User |
|---|---|---|
| Text search | Yes | Yes |
| Image search | Yes | Yes |
| Browse by category | Yes | Yes |
| View and click through to products | Yes | Yes |
| Star ratings | Saved in browser session only; lost when you close the tab | Saved permanently to your account; available across devices |
| Personalized ranking | No | Yes — results improve based on your rating history |
| Style preference learning | No | Yes — ATLAZ learns your color, brand, and style preferences over time |

> **Beyond Original Scope — User Preference Learning**
> When a signed-in user rates products, ATLAZ does not just store the rating — it builds a preference profile that includes learned color affinities, brand preferences, style keywords, and price-range tendencies. This profile is used to re-rank future search results so that items matching your taste appear higher. Building a preference-learning system that feeds back into search ranking requires a feedback pipeline, a profile model, and a re-ranking algorithm. **Typical build cost: $10,000–$20,000.**

---

### Navigating the Site

**[Screenshot: The full navigation bar on desktop showing the ATLAZ logo, Home link, four category dropdowns (Women's Clothing, Footwear, Accessories, Jewelry), and the right-side links (Support, Contact, Sign Up, Sign In)]**

#### The Navigation Bar (Desktop)

The top navigation bar is visible on every page. From left to right:

- **ATLAZ logo** — Clicking the logo returns you to a clean homepage with an empty search bar. If you are in the middle of viewing results, clicking the logo clears all results, refinements, and uploaded images without a full page reload.
- **Home** — Same behavior as clicking the logo.
- **Women's Clothing** — Hover to reveal subcategories: Dresses, Tops & Blouses, Pants & Jeans, Skirts, Outerwear, Activewear, Swimwear.
- **Footwear** — Hover to reveal: Heels, Boots, Sneakers, Flats & Loafers, Sandals.
- **Accessories** — Hover to reveal: Handbags & Totes, Scarves & Wraps, Hats & Caps, Sunglasses, Belts.
- **Jewelry** — Hover to reveal: Necklaces, Earrings, Bracelets, Rings, Jewelry Sets.
- **Support** and **Contact** — Links to the support and contact pages (right side).
- **Sign Up / Sign In** — Or, if you are already signed in, your name or email and a **Sign Out** button.

Clicking a top-level category (e.g., "Women's Clothing") runs a browse search for that entire category. Clicking a subcategory (e.g., "Dresses") runs a more specific browse search for that item type.

#### Full Category Reference

| Top-Level Category | Subcategories |
|---|---|
| Women's Clothing | Dresses, Tops & Blouses, Pants & Jeans, Skirts, Outerwear, Activewear, Swimwear |
| Footwear | Heels, Boots, Sneakers, Flats & Loafers, Sandals |
| Accessories | Handbags & Totes, Scarves & Wraps, Hats & Caps, Sunglasses, Belts |
| Jewelry | Necklaces, Earrings, Bracelets, Rings, Jewelry Sets |

#### The Navigation Bar (Mobile)

On small screens the navigation bar collapses. A hamburger icon (three horizontal lines) appears in the top-right corner.

- **Tap the hamburger icon** to open the full-screen mobile menu.
- The menu lists **Home**, then each category as a row. Tap the category name to browse it directly, or tap the small arrow on the right side of the row to expand and reveal subcategories.
- Below the categories you will find **Support**, **Contact**, and either **Sign Up / Sign In** or your account name and **Sign Out**.
- Tapping any link in the mobile menu automatically closes the menu.
- Tap the X icon (which replaces the hamburger while the menu is open) to close the menu without navigating.

**[Screenshot: The mobile menu open on a phone-sized screen, showing the expanded "Women's Clothing" category with its subcategories visible]**

---

#### The Footer

The footer appears at the bottom of every page and contains:

- **Shop** column — Quick links to Women's Clothing, Footwear, Accessories, Jewelry, New Arrivals, and Sale.
- **Customer Service** column — Contact Us, Shipping Info, Returns & Exchanges, Track Order, Size Guide, FAQ.
- **About** column — Our Story, Careers, Sustainability, Press, Blog.
- **Legal** column — Privacy Policy, Terms of Service, Cookie Policy, Accessibility.
- **Newsletter** — A secondary email subscription form (enter your email and click the arrow button).
- **Social media icons** — Links to Facebook, Twitter, Instagram, and Pinterest.
- **Copyright** and **Powered by Atlaz AI** at the very bottom.

---

## Searching for Products

ATLAZ supports three ways to search: by text, by image, or by combining both. All three are accessible from the homepage.

### Text Search

The search bar is the large text area in the center of the homepage. It accepts multi-line input and supports natural, conversational descriptions.

**[Screenshot: The search bar area with the placeholder text visible: "Try: 'I need a floral dress for a garden party that's elegant but not too formal'"]**

**How to search:**

1. Click in the search bar and type your description. You can be as specific or as casual as you like.
2. Press **Enter** or click the **Search** button.
3. The search button is disabled until you have typed at least **3 characters**.
4. You can press **Enter** to search, or **Shift+Enter** to add a new line within the search box (for longer, multi-line descriptions).

**Example queries that work well:**

- "Navy wrap dress for a summer garden party"
- "Cozy oversized knit sweater in earthy tones, under $80"
- "Silver minimalist hoop earrings"
- "Wide-leg trousers with a high waist, not cropped"
- "Something bold and colorful — chunky platform sandals"
- "Eileen Fisher or similar — relaxed linen look"

**Example search pills** — Below the search bar, three clickable example searches are shown:

- "Slinky black dress for date night"
- "Casual summer brunch outfit"
- "Business casual blazer"

Clicking any pill immediately runs that search, filling the search bar and showing results.

**[Screenshot: The example search pills below the search bar, showing the three pill buttons]**

#### What Happens Behind the Scenes

When you click Search, the AI processes your query through several steps. You will see these steps progress in real time in a loading modal:

1. **Understanding your search** — The AI reads your text.
2. **Extracting style attributes and intent** — It identifies the item type (dress, shoe, bag), color palette, style keywords (casual, formal, boho), price range, occasion, and brand preferences.
3. **Generating semantic embeddings** — Your intent is converted into a numerical vector (a list of 1,536 numbers) that captures the meaning of what you described.
4. **Searching the ATLAZ fashion index** — That vector is compared against every product in the database using cosine similarity, combined with full-text search matching.
5. **Comparing styles, colors, and fits** — Results are scored and ranked.
6. **Ranking products by relevance** — Your personal preferences (if signed in) boost or lower individual results.
7. **Applying quality filters** — Products below quality thresholds (e.g., missing images, suspiciously low prices) are removed.
8. **Curating your results** — The final ranked list is prepared for display.

**[Screenshot: The search loading modal showing the "ATLAZ AI - Fashion Intelligence" header, the quoted search query, the stacking progress messages with checkmarks, the simulated vector match lines with percentage bars, and the progress bar at the bottom]**

> **Beyond Original Scope — Animated AI Progress Modal**
> Most search engines show a simple spinner. ATLAZ shows a live-updating modal with step-by-step AI progress messages, simulated vector similarity scores for matching products, and fan-out query expansion — designed to build confidence in the AI's work and reduce perceived wait time. **Typical build cost: $3,000–$5,000.**

#### Fan-Out Query Expansion

For many searches, the AI identifies related sub-queries that will broaden your results. For example, if you search for "casual summer dress," the AI might also search for "lightweight sundress," "cotton day dress," and "relaxed beach dress." These additional queries appear as gray tags under the label "Also searching these queries and more:" along with a refresh button to see different ones.

**[Screenshot: The fan-out query section showing "Also searching these queries and more:" with three quoted query tags and a circular refresh icon]**

> **Beyond Original Scope — AI Fan-Out Query Expansion**
> Standard search runs one query. ATLAZ uses the LLM to generate multiple related search queries from your single input, then merges and de-duplicates the results. This dramatically improves recall for vague or creative queries. **Typical build cost: $3,000–$6,000.**

---

### Image Search (Visual Search)

Below the text search bar, there is an image upload area labeled "Or Search by Image." You can upload photos of clothing, accessories, or outfits and ATLAZ will find visually similar products.

**Specifications:**

| Constraint | Limit |
|---|---|
| Maximum images per search | 5 |
| Maximum file size per image | 5 MB |
| Supported file formats | JPG, PNG |

**How to upload images:**

1. Click anywhere inside the upload zone (the dashed-border area with the upload icon), then select one or more files from your device's file picker.
2. Alternatively, drag and drop image files directly onto the upload zone. The zone highlights when a file is dragged over it.
3. Uploaded images appear as thumbnails below the upload zone. Each thumbnail has an **X** button to remove it.
4. The counter in the upload zone updates to show "2/5 images" (or however many you have uploaded out of the maximum 5).

**[Screenshot: The image upload area showing two uploaded image thumbnails with X buttons, the upload zone showing "2/5 images", and the "Search by Images" button below]**

Once you have at least one image uploaded, a **Search by Images** button appears below the thumbnails. Click it to run the visual search.

If an uploaded file is not JPG or PNG, or exceeds 5 MB, an error message appears below the upload zone specifying which file was rejected and why.

> **Beyond Original Scope — AI Visual Search**
> Image-based product search requires converting uploaded photos into CLIP-compatible embeddings, then comparing those embeddings against the product catalog's pre-computed image vectors. This involves a vision model pipeline (embedding generation from arbitrary user photos), a separate image embedding column in the database, and a similarity search path. **Typical build cost: $10,000–$20,000.**

---

### Hybrid Search (Text + Images)

You can type a description in the search bar *and* upload images at the same time. When both are present, ATLAZ combines the textual intent with the visual style signals for more precise results.

**How it works:**

1. Type a description in the search bar (e.g., "like this but in burgundy").
2. Upload one or more reference images.
3. The button label changes to **Hybrid Search (Text + Images)** when both a text query (3+ characters) and at least one image are present.
4. A note below the button confirms: "Combining your text description with uploaded images for the most accurate results."
5. Click the button to search.

The AI will describe what it understood in the intent box. For hybrid searches, it explains both the text intent and what it detected from the images.

> **Beyond Original Scope — Hybrid Text+Image Search**
> Combining text embeddings with image embeddings into a unified search requires a weighted fusion strategy, a custom scoring function, and careful tuning to balance the two signal types. **Typical build cost: $5,000–$10,000** (in addition to the text and image search infrastructure).

---

### Browsing by Category

Clicking any category or subcategory in the navigation bar runs a browse search. Browse differs from text search in an important way:

- **Text search** uses AI semantic matching against the entire catalog — best for creative or descriptive queries.
- **Category browse** uses keyword matching against product titles — best for exploring a general category when you are not looking for anything specific.

For example, clicking "Dresses" in the navigation searches for products whose titles contain the word "dresses." Clicking "Footwear" searches for products with footwear-related terms.

After a category browse loads results, you can still use the refinement feature (described below) to narrow down within the browse results using natural language.

---

## Understanding Your Results

Once a search completes, several elements appear on the page.

### The Intent Explanation Box

Immediately below the search area, a box displays a natural-language explanation of what the AI understood from your query. This explanation is generated by the same AI that processed your search and is written in a conversational tone.

To the right of the explanation text, a randomly selected fashion illustration appears (a stylized silhouette). This illustration is decorative and changes each time you search.

**[Screenshot: The intent explanation box showing a paragraph of text like "I understand you're looking for a casual summer dress — something lightweight and flowy, possibly in bright or warm tones, suitable for daytime wear..." with a fashion silhouette illustration to the right]**

If the AI's interpretation does not match what you intended, rewrite your query with different phrasing, more specific details, or explicit constraints ("not formal," "under $50," "no black").

> **Beyond Original Scope — Intent Transparency Display**
> Most search engines do not explain what they understood from your query. ATLAZ generates a human-readable explanation of the extracted intent (category, color, style, occasion, price range, brand signals) and displays it alongside results. This requires an additional LLM call to produce the explanation text. **Typical build cost: $2,000–$4,000.**

---

### Quality Warning

If the AI determines that the available results are a poor match for what you asked — for example, because the catalog does not contain products closely matching a very specific or unusual request — a quality warning banner appears above the results grid.

The warning has an info icon, a text explanation of why results may be limited, and a **Start New Search** button to quickly try a different query.

**[Screenshot: The quality warning banner showing the info icon, a message like "We found some results, but they may not closely match your specific request. Try broadening your description or using different keywords.", and the Start New Search button]**

---

### Result Count and Sorting

A header bar above the results grid shows:

- **"Showing results X–Y of Z"** — The range of products currently visible on the page (e.g., "Showing results 1–12 of 87") out of the total found.
- A **New Search** button on the right to clear everything and start over.

Results are ranked by a combination of:

1. **Semantic similarity** — How closely the product's embedding matches your query's embedding.
2. **Text relevance** — How well the product title matches the keywords in your query.
3. **Personal preference boost** — If you are signed in and have rated other products, items similar to those you rated highly are boosted.
4. **Quality score** — Products with better images, descriptions, and pricing data rank slightly higher.
5. **Diversity factor** — A small de-duplication penalty prevents the same brand from dominating all top results.

---

## Working with Product Cards

Each search result appears as a card in a responsive grid (3 columns on desktop, 2 on tablet, 1 on mobile).

**[Screenshot: A single product card showing, from top to bottom: the product image, a "SALE" badge in the top-right corner of the image, the brand name in small gray text, the product title in bold, a short description, the "This item is currently on sale" notice, the price, the star rating row with the "How relevant are these results?" label, and the "View Product" button]**

### Product Information Displayed

Each card shows the following information, from top to bottom:

- **Product image** — Fills the top of the card. If the image fails to load (broken link), a gray placeholder reading "Image unavailable" appears instead.
- **SALE badge** — A red badge in the top-right corner of the image area, shown only for items currently on sale.
- **Brand or merchant name** — Shown in small gray text above the title. If the brand is unknown, the retailer/merchant name is shown instead. If neither is available, this line is hidden.
- **Product title** — The main name of the item, displayed in bold.
- **Description** — A short product description from the retailer (shown only if the retailer provided one).
- **Sale notice** — "This item is currently on sale" appears below the description for sale items.
- **Price** — Formatted in the product's listed currency (e.g., "$49.99" for USD, or the appropriate symbol for other currencies). If no price is listed, "Price on request" is shown.

### Viewing a Product

At the bottom of every card, a **View Product** button opens the retailer's original product page in a new browser tab. This takes you directly to the store where you can view full details, select sizes and colors, and purchase the item.

---

### Rating Products (Star System)

Below the price, each card displays a row of five stars and the label "How relevant are these results?" This rating is about relevance — how well this product matches what you were searching for — not a general product review.

**How to rate:**

1. Hover over the stars to preview a rating. A label appears next to the stars showing the meaning of each level.
2. Click a star to set your rating. Your selection is saved immediately.
3. You can change your rating at any time by clicking a different star.

| Stars | Label | Meaning |
|---|---|---|
| 1 | Not relevant | This product has nothing to do with what I searched for |
| 2 | Slightly relevant | It shares a vague connection but is not what I meant |
| 3 | Somewhat relevant | It is in the right category but misses key attributes |
| 4 | Very relevant | Close to what I described, with minor differences |
| 5 | Excellent match | Exactly or nearly exactly what I was looking for |

**Star color behavior:** Unrated stars are gray outlines. Filled stars are yellow. When hovering, the hovered stars turn a brighter gold.

**[Screenshot: A product card's star rating area showing 4 out of 5 stars filled in yellow, with the label "Very relevant" displayed next to the stars]**

**Signed-in vs. anonymous ratings:**

- **Signed in** — Your rating is saved to your account permanently. It persists across browser sessions and devices, and is used to personalize your future search results.
- **Anonymous** — Your rating is saved in your browser's session storage. It lasts until you close the tab or browser. It is not used for personalization.

> **Beyond Original Scope — Rating-Based Search Personalization**
> Collecting star ratings is standard. Using those ratings to dynamically re-rank future search results (boosting products similar to highly-rated ones, suppressing products similar to poorly-rated ones) is a personalization layer that requires a feedback loop between the rating system and the search ranking algorithm. **Typical build cost: $8,000–$15,000.**

---

### Leaving Feedback (Low-Rating Popover)

When you give a product **1 or 2 stars**, a feedback popover slides in below the stars. This is an optional way to tell ATLAZ *why* the result was not relevant.

**[Screenshot: The feedback popover expanded below a star rating showing 2 stars, with the header "Why wasn't this relevant?", the subtitle "Optional — helps us improve your results", a text area with placeholder "e.g. wrong style, wrong color, too expensive, not my size...", a character counter showing "0/500", and two buttons: "Skip" and "Send Feedback"]**

**How the popover works:**

1. It appears automatically when you click 1 or 2 stars. The text area is focused so you can start typing immediately.
2. Type your feedback (up to **500 characters**). The character counter at the bottom-right updates in real time.
3. Click **Send Feedback** to submit. The button is disabled (grayed out) until you type at least one character.
4. Click **Skip** or the X icon to dismiss the popover without sending feedback. Your star rating is kept either way.
5. You can also press **Escape** to dismiss, or **Ctrl+Enter** (Cmd+Enter on Mac) to submit.

The popover does *not* appear for ratings of 3, 4, or 5 stars.

> **Beyond Original Scope — Contextual Feedback Collection**
> Collecting structured "why not relevant?" feedback on low ratings, tied to specific product-query pairs, requires a feedback data model, a conditional UI trigger, and a storage pipeline. This data can be used to improve search quality over time. **Typical build cost: $2,000–$4,000.**

---

### Community Ratings

Once a product has received at least **5 ratings** from all users combined (signed-in users only), a line of community statistics appears below the star rating on that product's card:

**"X% found relevant . Y% gave 5 stars"**

- **X% found relevant** — The percentage of all ratings that were 3 stars or higher.
- **Y% gave 5 stars** — The percentage of all ratings that were exactly 5 stars.

This information reflects the collective judgment of all users who have rated that product, not just your own rating. Products with fewer than 5 total ratings do not show community stats.

---

## Refining Your Results

### What Refinement Does

After you get search results, you may want to narrow them down without starting a completely new search. The refinement feature lets you do this using natural language.

Refinement works differently from a new search:

- A **new search** queries the entire product database from scratch.
- A **refinement** takes only the products already in your current results and uses AI semantic filtering to keep only those that also match your refinement phrase.

This means refinement is fast (it works on a smaller set) and preserves the context of your original search.

> **Beyond Original Scope — Semantic AI Refinement**
> Standard e-commerce filtering uses checkboxes (color: red, size: M, price: under $50). ATLAZ refinement accepts free-form natural language ("more casual, cotton, earth tones") and uses embedding cosine similarity to re-score the existing results against the refinement text. This requires generating a new embedding for the refinement query, fetching stored embeddings for the current results, computing pairwise similarity, and applying an adaptive threshold. **Typical build cost: $8,000–$15,000.**

### How to Refine

After results appear, a **Refine Results** box is shown above the results grid. It contains a text input, a Refine Results button, and a list of example refinement phrases.

**[Screenshot: The refinement box showing the input field with placeholder text "Want to narrow it down? Filter by typing a request like 'Only in white and under $100.'", the "Refine Results" button, and the example refinement list below]**

**Steps:**

1. Type a refinement phrase in the input box. For example:
   - "only in white and under $100"
   - "cotton material, breathable"
   - "casual vibes or formal occasion"
   - "sustainable or eco-friendly"
   - "popular with 4+ stars"
   - "midi length, not mini"
2. Click **Refine Results** or press **Enter**.
3. While the refinement runs, the results grid fades to 40% opacity and a semi-transparent overlay appears with a spinning indicator and the message "Refining your results..."
4. When complete, the grid updates with the filtered results.

**[Screenshot: The results grid during refinement, showing the semi-transparent white overlay with the spinning circle and "Refining your results..." text, with the product cards faded in the background]**

The refinement box also displays a count: "Currently showing X results" at the bottom, so you can see how many products you are filtering from.

**Clearing the refinement input:** If you type something and decide not to refine, click the small X button inside the input field to clear it.

---

### Refinement Breadcrumb (History)

Each time you apply a refinement, a breadcrumb trail appears above the results grid. The breadcrumb shows your search path:

**Original search (87)** / **"only white" (23)** / **"under $50" (9)**

Each node shows the query or refinement text and the number of results at that level in parentheses. The currently active level is bold and underlined.

**[Screenshot: The refinement breadcrumb showing three nodes separated by slashes — the original search query, a first refinement, and a second refinement — with "Clear Filters" on the right side]**

**How to navigate the breadcrumb:**

- **Click any node** to jump back to that level. All refinements applied after it are discarded, and the results are restored to what they were at that point.
- **Click "Clear Filters"** (shown to the right of the breadcrumb) to jump all the way back to your original unrefined results.

### Refinement Limits

You can apply a maximum of **3 total levels**: your original search plus up to 2 successive refinements. When the limit is reached:

- The refinement input field is disabled (grayed out, cursor changes to "not allowed").
- A message in italic reads: "Max refinement levels reached. Click breadcrumb to go back."

To continue refining, click a breadcrumb node to go back to an earlier level, then apply a different refinement from there.

---

## Pagination

When a search returns more results than fit on one page, pagination controls appear above and below the results grid.

### Changing Results Per Page

A dropdown labeled "Results per page:" lets you choose how many products appear on each page.

| Option | Products per page |
|---|---|
| 12 | 12 (default) |
| 24 | 24 |
| 60 | 60 |

Changing this setting re-runs the search and resets you to page 1.

### Page Navigation

The pagination bar shows:

- **Previous** button — Disabled (grayed out) on page 1.
- **Page X of Y** — Your current page and total page count.
- **Next** button — Disabled on the last page.

Clicking Previous or Next loads the adjacent page and automatically scrolls to the top of the page.

**[Screenshot: The pagination bar showing "Results per page: 12" dropdown on the left, and "Previous | Page 2 of 8 | Next" buttons on the right]**

### Instant vs. Loaded Pages

The first 100 results from any search are cached locally in your browser. Navigating between pages within those first 100 results is instant — no loading delay.

If your search returned more than 100 total results and you navigate to a page beyond the cached range (e.g., page 9 at 12 per page = result 97–108), ATLAZ fetches that page from the server, which takes a moment to load.

---

## Your Account

### Signing Up

1. Click **Sign Up** in the navigation bar.
2. The Sign Up page offers two methods:

| Method | Steps |
|---|---|
| **Google OAuth** | Click "Sign up with Google." A Google account picker appears. Select your account. You are immediately signed in and redirected to the homepage. No password needed. |
| **Email / Password** | Fill in First Name, Last Name, Email Address, and Password (minimum 8 characters). Click "Create Account." Check your email for a verification link. Click the link. You are redirected to the Sign In page with a verification confirmation. |

3. If you already have an account, click the "Already have an account? **Sign In**" link at the bottom.

### Signing In

1. Click **Sign In** in the navigation bar.
2. The Sign In page defaults to showing the **Sign in with Google** button. Click it to sign in with your Google account.
3. To sign in with email instead, click the "Or sign in with email" link below the Google button. The email/password form appears.
4. Enter your email and password, then click **Sign In**.
5. If you just verified your email, the page shows a green banner: "Your email has been verified successfully!" and the email form is shown automatically.
6. After signing in, you are redirected to the homepage (or to the admin dashboard if your account has an admin role).

**[Screenshot: The Sign In page showing the Google sign-in button, with the "Or sign in with email" link below, and the "Don't have an account? Sign Up" link at the bottom]**

### Signing Out

- **Desktop:** Click your name or email address in the top-right of the navigation bar, then click **Sign Out**.
- **Mobile:** Open the mobile menu, scroll to the bottom, and tap **Sign Out**.

After signing out, you are returned to the homepage in an anonymous session.

### What Your Account Remembers

When you are signed in, the following data is stored permanently:

- **Star ratings** — Every rating you give is saved and applied to future searches to improve your result rankings.
- **Feedback text** — Any feedback submitted via the low-rating popover is saved and associated with the product and your search.
- **Style preferences** — Over time, ATLAZ builds a profile of your preferences:
  - Colors you tend to rate highly
  - Brands you gravitate toward
  - Style keywords associated with your top-rated products
  - Price ranges you prefer
  - Categories you search most often

This data is tied to your account and is not shared with other users.

---

## Additional Features

### Email Newsletter Subscription

Near the bottom of the homepage (above the footer), a subscription section is displayed with the heading "Stay Updated on Fashion Trends" and the subtitle "Get exclusive deals and personalized fashion recommendations delivered to your inbox."

**[Screenshot: The email subscription section showing the heading, subtitle, and the email input field with the "Subscribe" button]**

**How to subscribe:**

1. Enter your email address in the input field.
2. Click **Subscribe**.
3. If successful, a confirmation message appears in blue below the form.
4. If the email is invalid or already subscribed, an error message appears in red.

A second, smaller newsletter form also appears in the footer's Newsletter column (enter your email and click the arrow icon).

---

### "How to Use" Section

When you first visit the homepage (before performing any search), a "How to Use Fashion Search" section appears below the search area. It shows three illustrated steps:

1. **Describe in Your Words** — "Simply type what you're looking for in natural language. Be as specific or casual as you like — our AI understands context and style preferences."
2. **Upload Inspiration** — "Found something you love? Upload up to 5 images and we'll find similar styles across thousands of brands and retailers."
3. **Get Perfect Matches** — "Receive personalized results that truly match your vision. Filter by price, brand, color, and more to find exactly what you need."

This section disappears once you perform a search and reappears when you click New Search or the ATLAZ logo to return to the clean homepage.

**[Screenshot: The "How to Use Fashion Search" section showing the three cards, each with a number badge, an illustration image, a title, and a description]**

---

### New Search Button

A **New Search** button appears in two places once results are showing:

1. In the results header bar (to the right of the "Showing results X–Y of Z" text).
2. At the bottom of the results, after all product cards and pagination, as a larger **Start New Search** button.

Clicking either button:

- Clears all search results
- Clears any applied refinements and the breadcrumb trail
- Clears all uploaded images
- Empties the search bar
- Returns the page to the clean homepage state (hero section, example pills, How to Use section)
- Scrolls to the top of the page

---

## Limits and Constraints Quick Reference

| Feature | Limit |
|---|---|
| Search query minimum length | 3 characters |
| Images per search | Up to 5 |
| Image file size | 5 MB per file |
| Supported image formats | JPG, PNG |
| Refinement levels | 3 total (original search + 2 refinements) |
| Results per page options | 12, 24, or 60 |
| Star rating scale | 1–5 |
| Feedback text maximum | 500 characters |
| Password minimum length | 8 characters |
| Community stats threshold | 5 ratings required before stats are shown |
| First-page cache | First 100 results cached locally for instant pagination |

---

## Beyond-Scope Feature Summary

The following features in ATLAZ go beyond what a standard e-commerce fashion search site includes. Each required custom engineering work beyond typical off-the-shelf solutions.

| Feature | What It Does | Typical Build Cost |
|---|---|---|
| AI Natural Language Understanding | Extracts structured fashion intent from free-form English using a large language model | $15,000–$30,000 |
| AI Visual Search | Finds products matching uploaded photos using CLIP-compatible image embeddings | $10,000–$20,000 |
| Hybrid Text+Image Search | Combines text and image signals in a single unified search | $5,000–$10,000 |
| AI Fan-Out Query Expansion | Generates related sub-queries from your input to broaden results | $3,000–$6,000 |
| Semantic AI Refinement | Filters existing results using natural language and embedding similarity | $8,000–$15,000 |
| Rating-Based Personalization | Uses your star ratings to dynamically re-rank future search results | $8,000–$15,000 |
| User Preference Learning | Builds a color/brand/style/price preference profile from your rating history | $10,000–$20,000 |
| Intent Transparency Display | Shows a natural-language explanation of what the AI understood from your query | $2,000–$4,000 |
| Contextual Feedback Collection | Collects structured "why not relevant?" feedback on low-rated products | $2,000–$4,000 |
| Animated AI Progress Modal | Shows real-time AI processing steps with simulated vector match scores | $3,000–$5,000 |
| Community Rating Aggregation | Aggregates and displays "% found relevant" and "% gave 5 stars" stats | $3,000–$5,000 |
| **Total** | | **$69,000–$139,000** |
