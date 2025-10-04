import { useState, useEffect } from "react";
import UserProfile from "@/components/UserProfile";
import AddChannelForm from "@/components/AddChannelForm";
import BanTimer from "@/components/BanTimer";
import { Shield, Clock, Zap } from "lucide-react";

interface BanEntry {
  id: string;
  channel: string;
  username: string;
  endTime: Date;
}

const Index = () => {
  const [username, setUsername] = useState("");
  const [banTimers, setBanTimers] = useState<BanEntry[]>([]);

  // Load data from localStorage on component mount
  useEffect(() => {
    const savedUsername = localStorage.getItem("twitchUsername");
    const savedTimers = localStorage.getItem("banTimers");
    
    if (savedUsername) {
      setUsername(savedUsername);
    }
    
    if (savedTimers) {
      const parsedTimers = JSON.parse(savedTimers).map((timer: any) => ({
        ...timer,
        endTime: new Date(timer.endTime)
      }));
      setBanTimers(parsedTimers);
    }
  }, []);

  // Save data to localStorage when state changes
  useEffect(() => {
    if (username) {
      localStorage.setItem("twitchUsername", username);
    }
  }, [username]);

  useEffect(() => {
    localStorage.setItem("banTimers", JSON.stringify(banTimers));
  }, [banTimers]);

  const handleAddChannel = (channel: string, durationInMinutes: number) => {
    const endTime = new Date(Date.now() + durationInMinutes * 60 * 1000);
    const newBanTimer: BanEntry = {
      id: Date.now().toString(),
      channel,
      username,
      endTime
    };
    
    setBanTimers(prev => [...prev, newBanTimer]);
  };

  const handleRemoveTimer = (id: string) => {
    setBanTimers(prev => prev.filter(timer => timer.id !== id));
  };

  // Group bans by channel and sort alphabetically
  const bansByChannel = banTimers.reduce((acc, timer) => {
    const channelName = timer.channel.toLowerCase();
    if (!acc[channelName]) {
      acc[channelName] = [];
    }
    acc[channelName].push(timer);
    return acc;
  }, {} as Record<string, BanEntry[]>);

  const sortedChannels = Object.keys(bansByChannel).sort();

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
              <Shield className="h-6 w-6 text-primary" />
            </div>
            <h1 className="text-4xl font-bold gradient-text">Twitch Ban Tracker</h1>
          </div>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Track ban timers for a user across multiple Twitch channels. 
            Organized by channel to see all bans at a glance.
          </p>
        </div>

        {/* User Profile */}
        <UserProfile username={username} onUsernameChange={setUsername} />

        {/* Add Channel Form */}
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold flex items-center gap-2">
            <Zap className="h-6 w-6 text-primary" />
            Add New Ban Timer
          </h2>
          <AddChannelForm onAddChannel={handleAddChannel} />
        </div>

        {/* Bans organized by channel */}
        {sortedChannels.length > 0 && (
          <div className="space-y-6">
            {sortedChannels.map((channel) => {
              const channelBans = bansByChannel[channel];
              const activeBans = channelBans.filter(timer => timer.endTime > new Date());
              const expiredBans = channelBans.filter(timer => timer.endTime <= new Date());
              
              return (
                <div key={channel} className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="px-4 py-2 rounded-lg bg-primary/10 border border-primary/20">
                      <h2 className="text-xl font-bold gradient-text">#{channel}</h2>
                    </div>
                    <div className="h-px flex-1 bg-border"></div>
                    <div className="text-sm text-muted-foreground">
                      {channelBans.length} {channelBans.length === 1 ? 'ban' : 'bans'}
                    </div>
                  </div>

                  {/* Active bans for this channel */}
                  {activeBans.length > 0 && (
                    <div className="space-y-3">
                      <h3 className="text-sm font-medium flex items-center gap-2 text-warning">
                        <Clock className="h-4 w-4" />
                        Active ({activeBans.length})
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {activeBans.map((timer) => (
                          <BanTimer
                            key={timer.id}
                            id={timer.id}
                            username={timer.username}
                            endTime={timer.endTime}
                            onRemove={handleRemoveTimer}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Expired bans for this channel */}
                  {expiredBans.length > 0 && (
                    <div className="space-y-3">
                      <h3 className="text-sm font-medium flex items-center gap-2 text-success">
                        <Shield className="h-4 w-4" />
                        Expired ({expiredBans.length})
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {expiredBans.map((timer) => (
                          <BanTimer
                            key={timer.id}
                            id={timer.id}
                            username={timer.username}
                            endTime={timer.endTime}
                            onRemove={handleRemoveTimer}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Empty State */}
        {banTimers.length === 0 && username && (
          <div className="text-center py-12">
            <div className="w-16 h-16 rounded-xl bg-muted/50 flex items-center justify-center mx-auto mb-4">
              <Clock className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold mb-2">No Ban Timers Yet</h3>
            <p className="text-muted-foreground">
              Add your first channel ban timer above to get started.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;
