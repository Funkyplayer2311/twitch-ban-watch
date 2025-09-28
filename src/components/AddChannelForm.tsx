import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface AddChannelFormProps {
  onAddChannel: (channel: string, duration: number) => void;
}

const AddChannelForm = ({ onAddChannel }: AddChannelFormProps) => {
  const [channel, setChannel] = useState("");
  const [duration, setDuration] = useState<string>("");
  const [timeUnit, setTimeUnit] = useState<string>("hours");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!channel.trim()) {
      toast({
        title: "Error",
        description: "Please enter a channel name",
        variant: "destructive",
      });
      return;
    }

    if (!duration || parseInt(duration) <= 0) {
      toast({
        title: "Error",
        description: "Please enter a valid duration",
        variant: "destructive",
      });
      return;
    }

    let durationInMinutes = parseInt(duration);
    
    switch (timeUnit) {
      case "minutes":
        break;
      case "hours":
        durationInMinutes *= 60;
        break;
      case "days":
        durationInMinutes *= 60 * 24;
        break;
    }

    onAddChannel(channel.trim(), durationInMinutes);
    setChannel("");
    setDuration("");
    
    toast({
      title: "Channel Added",
      description: `Ban timer set for #${channel.trim()}`,
    });
  };

  return (
    <Card className="p-6 card-glow">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="channel" className="text-sm font-medium">
            Channel Name
          </Label>
          <Input
            id="channel"
            type="text"
            placeholder="Enter channel name"
            value={channel}
            onChange={(e) => setChannel(e.target.value)}
            className="mt-1 bg-input border-border focus:ring-primary"
          />
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="duration" className="text-sm font-medium">
              Duration
            </Label>
            <Input
              id="duration"
              type="number"
              placeholder="0"
              min="1"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              className="mt-1 bg-input border-border focus:ring-primary"
            />
          </div>
          
          <div>
            <Label htmlFor="timeUnit" className="text-sm font-medium">
              Time Unit
            </Label>
            <Select value={timeUnit} onValueChange={setTimeUnit}>
              <SelectTrigger className="mt-1 bg-input border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="minutes">Minutes</SelectItem>
                <SelectItem value="hours">Hours</SelectItem>
                <SelectItem value="days">Days</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <Button 
          type="submit" 
          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Channel Ban Timer
        </Button>
      </form>
    </Card>
  );
};

export default AddChannelForm;