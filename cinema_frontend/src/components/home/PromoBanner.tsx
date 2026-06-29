export function PromoBanner() {
    return (
        <section className="w-full rounded-3xl overflow-hidden relative min-h-[400px] flex items-center">
            <div
                className="absolute inset-0 bg-cover bg-center"
                style={{
                    backgroundImage: "url('https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=1200&h=400&fit=crop')",
                }}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-background-dark via-background-dark/90 to-transparent"></div>

            <div className="relative z-10 p-8 md:p-16 max-w-2xl flex flex-col gap-6">
                <span className="text-primary font-bold tracking-widest uppercase">Special Offer</span>
                <h2 className="text-white text-4xl md:text-5xl font-black leading-tight">
                    Premium Experience<br />
                    Special Discounts
                </h2>
                <p className="text-white/80 text-lg">
                    Enhance your movie experience with our premium screens and sound systems.
                    Book tickets today and enjoy exclusive member benefits.
                </p>
                <button className="w-fit mt-2 flex items-center gap-2 rounded-full h-12 px-8 bg-white text-background-dark text-base font-bold tracking-wide hover:bg-primary transition-colors">
                    Learn More
                </button>
            </div>
        </section>
    );
}
