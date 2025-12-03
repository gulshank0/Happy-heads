import { Quote } from "lucide-react";

export default function Feedbacks() {
  const testimonials = [
    {
      name: "Priya Sharma",
      college: "Sharda University",
      avatar: "P",
      feedback: "Yaar HappyHeads mst website hai! 💕 Finally mil gaya koi jo mere jaise hi studies me serious hai. Love it yr! 😍",
      gradient: "from-pink-500 to-rose-500"
    },
    {
      name: "Priya Sharma",
      college: "Sharda University",
      avatar: "P",
      feedback: "Yaar HappyHeads mst website hai! 💕 Finally mil gaya koi jo mere jaise hi studies me serious hai. Love it yr! 😍",
      gradient: "from-pink-500 to-rose-500"
    },
    , {
      name: "Priya Sharma",
      college: "Sharda University",
      avatar: "P",
      feedback: "Yaar HappyHeads mst website hai! 💕 Finally mil gaya koi jo mere jaise hi studies me serious hai. Love it yr! 😍",
      gradient: "from-pink-500 to-rose-500"
    },
    {
      name: "Arjun Singh", 
      college: "Delhi University",
      avatar: "A",
      feedback: "Bro this app is actually legit! 🔥 Met so many cool people from my college. Campus dating scene sorted hai completely! 💯",
      gradient: "from-blue-500 to-cyan-500"
    },
    {
      name: "Ananya Gupta",
      college: "Mumbai University", 
      avatar: "A",
      feedback: "Omg guys use kro isko! 😭💕 Itne ache matches aate hai yahan pe. Sab verified students hai so tension nhi lena pdta safety ka! ✨",
      gradient: "from-purple-500 to-violet-500"
    },
    {
      name: "Rohit Kumar",
      college: "IIT Delhi",
      avatar: "R", 
      feedback: "Finally ek platform jo sirf college students ke liye hai! No fake profiles, sab genuine hai. Highly recommended! 🙌",
      gradient: "from-orange-500 to-red-500"
    }
  ];

  return (
    <section className="min-h-screen bg-black text-white py-20 px-6">
      <div className="max-w-8xl mx-auto ">
        {/* Header */}
        <div className="text-center mb-16 ">
          <h2 className="font-poppins text-4xl sm:text-5xl md:text-6xl font-bold mb-6">
            <span className="bg-gradient-to-r from-violet-400 to-pink-400 bg-clip-text text-transparent">
              Real Stories from Real Students
            </span>
          </h2>
          <p className="text-xl text-white/70 max-w-3xl mx-auto">
            See how "HappyHeads" has transformed college relationships across India's top universities.
          </p>
        </div>

        {/* Testimonials Grid */}
        <div className="grid md:grid-cols-3 gap-8 max-w-10xl mx-auto">
          {testimonials.map((testimonial, index) => (
            <div 
              key={index}
              className="backdrop-blur-md bg-white/5 border border-white/10 rounded-xl p-8 hover:scale-105 transition-transform duration-500 relative"
            >
              {/* Quote Icon */}
              <Quote className="absolute top-4 right-4 h-6 w-6 text-white/20" />
              
              {/* Avatar and Info */}
              <div className="flex items-center gap-4 mb-6">
                <div className={`w-12 h-12 rounded-full bg-gradient-to-r ${testimonial.gradient} flex items-center justify-center text-white font-bold text-lg`}>
                  {testimonial.avatar}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">{testimonial.name}</h3>
                  <p className="text-white/60 text-sm">{testimonial.college}</p>
                </div>
              </div>

              {/* Feedback */}
              <p className="text-white/80 leading-relaxed text-lg">
                "{testimonial.feedback}"
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}