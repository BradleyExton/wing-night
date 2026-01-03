import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import { Button } from '../components/common/Button';

export function Landing() {
  const navigate = useNavigate();
  const { isSignedIn, isLoaded } = useAuth();
  const [joinCode, setJoinCode] = useState('');

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (joinCode.trim()) {
      navigate(`/play/${joinCode.trim().toUpperCase()}`);
    }
  };

  const handleHostClick = () => {
    if (isSignedIn) {
      navigate('/dashboard');
    } else {
      navigate('/sign-up');
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-bg-primary">
      {/* Header */}
      <header className="p-4 flex justify-between items-center max-w-6xl mx-auto w-full">
        <div className="text-xl font-bold text-primary">Wing Night</div>
        {isLoaded && (
          <>
            {isSignedIn ? (
              <Link to="/dashboard">
                <Button variant="ghost" size="sm">Dashboard</Button>
              </Link>
            ) : (
              <div className="flex gap-2">
                <Link to="/sign-in">
                  <Button variant="ghost" size="sm">Sign In</Button>
                </Link>
                <Link to="/sign-up">
                  <Button variant="secondary" size="sm">Sign Up</Button>
                </Link>
              </div>
            )}
          </>
        )}
      </header>

      {/* Hero Section */}
      <section className="flex-1 flex flex-col items-center justify-center px-4 py-16">
        <div className="text-center mb-8">
          <h1 className="text-5xl md:text-7xl font-bold neon-glow mb-4">
            WING NIGHT
          </h1>
          <p className="text-xl md:text-2xl text-gray-400 mb-2">
            The Ultimate Hot Ones Party Game
          </p>
          <p className="text-gray-500 max-w-lg mx-auto">
            Gather your friends, eat progressively hotter wings, compete in challenges, and crown a champion.
          </p>
        </div>

        <div className="w-full max-w-md space-y-6">
          <Button
            variant="primary"
            size="lg"
            className="w-full text-xl py-4"
            onClick={handleHostClick}
          >
            Host a Game
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-700" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-bg-primary text-gray-500">or join a game</span>
            </div>
          </div>

          <form onSubmit={handleJoin} className="flex gap-2">
            <input
              type="text"
              placeholder="Enter room code"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              className="flex-1 bg-bg-card border border-gray-700 rounded-lg px-4 py-3 text-lg font-mono tracking-widest text-center uppercase focus:outline-none focus:border-primary"
              maxLength={4}
            />
            <Button type="submit" variant="secondary" size="lg" disabled={!joinCode.trim()}>
              Join
            </Button>
          </form>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4 bg-bg-card/50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Everything You Need</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <FeatureCard
              icon="🏆"
              title="Team Competition"
              description="Split into teams and compete for glory. Track points across multiple rounds."
            />
            <FeatureCard
              icon="📺"
              title="TV Display Mode"
              description="Cast the game to your big screen so everyone can follow along."
            />
            <FeatureCard
              icon="🌶️"
              title="Custom Sauces"
              description="Set your own sauce lineup from mild to wild. Track Scoville ratings."
            />
            <FeatureCard
              icon="📊"
              title="Live Scoring"
              description="Real-time points and leaderboards. See who's winning at a glance."
            />
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <StepCard
              number={1}
              title="Create"
              description="Set up your game, customize your sauce lineup, and create teams."
            />
            <StepCard
              number={2}
              title="Invite"
              description="Share the 4-letter room code with your friends. They join from their phones."
            />
            <StepCard
              number={3}
              title="Play"
              description="Eat wings, play mini-games, earn points, and crown a champion."
            />
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-16 px-4 bg-bg-card/50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">What People Say</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <TestimonialCard
              quote="Best party game we've ever played. The competitive scoring makes it way more fun!"
              author="Alex M."
            />
            <TestimonialCard
              quote="10/10 would sweat again. The TV display mode is perfect for watch parties."
              author="Jordan K."
            />
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-20 px-4 text-center">
        <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to Feel the Heat?</h2>
        <p className="text-gray-400 mb-8 max-w-md mx-auto">
          Create your free account and host your first Wing Night in minutes.
        </p>
        <Button
          variant="primary"
          size="lg"
          className="text-xl px-8 py-4"
          onClick={handleHostClick}
        >
          Start Hosting - Free
        </Button>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-gray-800">
        <div className="max-w-6xl mx-auto text-center text-gray-500 text-sm">
          <p>© {new Date().getFullYear()} Wing Night. Eat wings. Play games. Crown a champion.</p>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: string; title: string; description: string }) {
  return (
    <div className="bg-bg-card border border-gray-700 rounded-lg p-6 text-center">
      <div className="text-4xl mb-4">{icon}</div>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-gray-400 text-sm">{description}</p>
    </div>
  );
}

function StepCard({ number, title, description }: { number: number; title: string; description: string }) {
  return (
    <div className="text-center">
      <div className="w-12 h-12 rounded-full bg-primary text-black font-bold text-xl flex items-center justify-center mx-auto mb-4">
        {number}
      </div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-gray-400">{description}</p>
    </div>
  );
}

function TestimonialCard({ quote, author }: { quote: string; author: string }) {
  return (
    <div className="bg-bg-card border border-gray-700 rounded-lg p-6">
      <p className="text-gray-300 italic mb-4">"{quote}"</p>
      <p className="text-gray-500 text-sm">— {author}</p>
    </div>
  );
}
