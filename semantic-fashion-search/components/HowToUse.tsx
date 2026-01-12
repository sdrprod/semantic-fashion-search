import Image from 'next/image';

export function HowToUse() {
  const steps = [
    {
      number: 1,
      title: 'Describe in Your Words',
      description: 'Simply type what you\'re looking for in natural language. Be as specific or casual as you like - our AI understands context and style preferences.',
      image: '/images/image01.png',
    },
    {
      number: 2,
      title: 'Upload Inspiration',
      description: 'Found something you love? Upload up to 3 images and we\'ll find similar styles across thousands of brands and retailers.',
      image: '/images/image02.png',
      isPhone: true,
    },
    {
      number: 3,
      title: 'Get Perfect Matches',
      description: 'Receive personalized results that truly match your vision. Filter by price, brand, color, and more to find exactly what you need.',
      image: '/images/image03.png',
    },
  ];

  return (
    <section className="how-to-use">
      <div className="how-to-use-container">
        <h2 className="how-to-use-title">How to Use Fashion Search</h2>
        <p className="how-to-use-subtitle">Three simple ways to discover your perfect style</p>

        <div className="how-to-use-grid">
          {steps.map((step) => (
            <div key={step.number} className={`how-to-use-card ${step.isPhone ? 'phone-card' : ''}`}>
              <div className="how-to-use-image-container">
                <div className="how-to-use-number">{step.number}</div>
                <Image
                  src={step.image}
                  alt={step.title}
                  width={400}
                  height={300}
                  className="how-to-use-image"
                  priority
                />
              </div>
              <h3 className="how-to-use-card-title">{step.title}</h3>
              <p className="how-to-use-card-description">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
