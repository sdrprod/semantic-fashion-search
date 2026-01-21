#!/usr/bin/env python3
import json

# Read the products file
# CHANGE THIS PATH to match your Windows directory
with open('data/products.json', 'r') as f:
    products = json.load(f)

# Update image URLs based on product characteristics
for product in products:
    brand = product['brand'].lower().replace(' ', '-')
    title = product['title'].lower()
    description = product['description'].lower()
    tags = product['tags']

    # Extract key visual characteristics
    search_terms = []

    # Add primary product type
    if 'dress' in tags:
        if 'midi' in tags:
            search_terms.append('midi-dress')
        elif 'maxi' in tags:
            search_terms.append('maxi-dress')
        elif 'mini' in tags:
            search_terms.append('mini-dress')
        else:
            search_terms.append('dress')
    elif 'pants' in tags or 'jeans' in tags:
        if 'wide-leg' in tags:
            search_terms.append('wide-leg-pants')
        elif 'straight leg' in tags:
            search_terms.append('straight-leg-jeans')
        else:
            search_terms.append('trousers')
    elif 'skirt' in tags:
        search_terms.append('skirt')
    elif 'jacket' in tags or 'blazer' in tags or 'coat' in tags:
        if 'blazer' in tags:
            search_terms.append('blazer')
        elif 'denim' in tags:
            search_terms.append('denim-jacket')
        elif 'leather' in tags or 'moto' in tags:
            search_terms.append('leather-jacket')
        elif 'puffer' in tags:
            search_terms.append('puffer-jacket')
        else:
            search_terms.append('coat')
    elif 'boots' in tags:
        if 'ankle' in ' '.join(tags):
            search_terms.append('ankle-boots')
        elif 'combat' in ' '.join(tags):
            search_terms.append('combat-boots')
        else:
            search_terms.append('boots')
    elif 'sneakers' in tags:
        search_terms.append('white-sneakers')
    elif 'sandals' in tags:
        search_terms.append('sandals')
    elif 'flats' in tags:
        search_terms.append('ballet-flats')
    elif 'bag' in tags or 'tote' in tags:
        if 'tote' in tags:
            search_terms.append('leather-tote')
        elif 'crossbody' in tags:
            search_terms.append('crossbody-bag')
        elif 'backpack' in tags:
            search_terms.append('backpack')
        else:
            search_terms.append('handbag')
    elif 'sweater' in tags or 'knit' in tags or 'cardigan' in tags:
        search_terms.append('sweater')
    elif 'blouse' in tags or 'shirt' in tags:
        search_terms.append('blouse')
    elif 'hoodie' in tags or 'sweatshirt' in tags:
        search_terms.append('hoodie')
    elif 'leggings' in tags:
        search_terms.append('leggings')
    elif 'shorts' in tags:
        search_terms.append('denim-shorts')
    elif 'hat' in tags:
        search_terms.append('hat')
    elif 'scarf' in tags:
        search_terms.append('scarf')
    elif 'belt' in tags:
        search_terms.append('leather-belt')
    elif 'jewelry' in tags:
        if 'necklace' in tags:
            search_terms.append('gold-necklace')
        elif 'earrings' in tags:
            search_terms.append('gold-earrings')
    elif 'sunglasses' in tags:
        search_terms.append('sunglasses')
    elif 'tights' in tags or 'hosiery' in tags:
        search_terms.append('tights')

    # Add color if specified
    colors = ['black', 'white', 'ivory', 'red', 'blue', 'navy', 'green', 'pink',
              'grey', 'gray', 'beige', 'tan', 'camel', 'brown', 'yellow', 'orange',
              'burgundy', 'emerald', 'cream', 'cognac', 'mustard', 'olive', 'terracotta']

    for color in colors:
        if color in tags or color in description:
            if color == 'ivory':
                search_terms.append('white')
            elif color == 'grey':
                search_terms.append('gray')
            elif color == 'cognac':
                search_terms.append('brown')
            else:
                search_terms.append(color)
            break

    # Add material if relevant
    materials = ['silk', 'satin', 'leather', 'denim', 'linen', 'cashmere',
                'wool', 'cotton', 'suede', 'knit', 'fleece']
    for material in materials:
        if material in tags or material in description:
            search_terms.append(material)
            break

    # Create the Unsplash source URL
    if search_terms:
        search_query = ','.join(search_terms[:3])  # Limit to 3 terms for better results
        product['imageUrl'] = f'https://source.unsplash.com/400x600/?{search_query}'
    else:
        # Fallback to generic fashion image
        product['imageUrl'] = 'https://source.unsplash.com/400x600/?fashion'

# Write the updated products back
# CHANGE THIS PATH to match your Windows directory
with open('data/products.json', 'w') as f:
    json.dump(products, f, indent=2)

print(f"Updated {len(products)} product images successfully!")