import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { User, Edit2, Save, X } from "lucide-react";

interface UserProfileProps {
  username: string;
  onUsernameChange: (username: string) => void;
}

const UserProfile = ({ username, onUsernameChange }: UserProfileProps) => {
  const [isEditing, setIsEditing] = useState(!username);
  const [tempUsername, setTempUsername] = useState(username);

  const handleSave = () => {
    onUsernameChange(tempUsername.trim());
    setIsEditing(false);
  };

  const handleCancel = () => {
    setTempUsername(username);
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <Card className="p-6 card-glow">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            <Label htmlFor="username" className="text-lg font-semibold">
              Twitch Username
            </Label>
          </div>
          
          <div className="flex gap-2">
            <Input
              id="username"
              type="text"
              placeholder="Enter your Twitch username"
              value={tempUsername}
              onChange={(e) => setTempUsername(e.target.value)}
              className="bg-input border-border focus:ring-primary"
              autoFocus
            />
            <Button 
              onClick={handleSave}
              disabled={!tempUsername.trim()}
              size="sm"
              className="bg-success hover:bg-success/90 text-white"
            >
              <Save className="h-4 w-4" />
            </Button>
            {username && (
              <Button 
                onClick={handleCancel}
                variant="outline"
                size="sm"
                className="border-border"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6 card-glow">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
            <User className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Twitch Username</p>
            <p className="text-lg font-semibold gradient-text">@{username}</p>
          </div>
        </div>
        
        <Button
          onClick={() => setIsEditing(true)}
          variant="outline"
          size="sm"
          className="border-border hover:bg-primary/10"
        >
          <Edit2 className="h-4 w-4" />
        </Button>
      </div>
    </Card>
  );
};

export default UserProfile;