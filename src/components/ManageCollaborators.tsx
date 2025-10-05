import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { Users, Trash2, UserPlus } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Collaborator {
  id: string;
  username: string;
  role: string;
}

const ManageCollaborators = () => {
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [newUsername, setNewUsername] = useState("");
  const [newRole, setNewRole] = useState<"editor" | "viewer">("viewer");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadCollaborators();
  }, []);

  const loadCollaborators = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("ban_list_permissions")
      .select(`
        id,
        role,
        user_id,
        profiles!ban_list_permissions_user_id_fkey(username)
      `)
      .eq("owner_id", user.id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to load collaborators",
        variant: "destructive",
      });
      return;
    }

    const formatted = data.map((item: any) => ({
      id: item.id,
      username: item.profiles.username,
      role: item.role,
    }));

    setCollaborators(formatted);
  };

  const handleAddCollaborator = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Find user by username
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("id")
        .eq("username", newUsername.trim())
        .single();

      if (profileError || !profile) {
        throw new Error("User not found");
      }

      // Add permission
      const { error: permissionError } = await supabase
        .from("ban_list_permissions")
        .insert({
          owner_id: user.id,
          user_id: profile.id,
          role: newRole,
        });

      if (permissionError) throw permissionError;

      toast({
        title: "Collaborator added",
        description: `${newUsername} can now ${newRole === "editor" ? "edit" : "view"} your ban list`,
      });

      setNewUsername("");
      loadCollaborators();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to add collaborator",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveCollaborator = async (id: string) => {
    const { error } = await supabase
      .from("ban_list_permissions")
      .delete()
      .eq("id", id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to remove collaborator",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Collaborator removed",
    });

    loadCollaborators();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Manage Collaborators
        </CardTitle>
        <CardDescription>
          Share your ban list with other users. Editors can add/remove bans, viewers can only see them.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Add collaborator form */}
        <form onSubmit={handleAddCollaborator} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2 md:col-span-1">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                placeholder="Enter username"
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Permission</Label>
              <Select value={newRole} onValueChange={(value: "editor" | "viewer") => setNewRole(value)}>
                <SelectTrigger id="role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="viewer">Viewer (Read only)</SelectItem>
                  <SelectItem value="editor">Editor (Can add/remove)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button type="submit" disabled={loading} className="w-full">
                <UserPlus className="h-4 w-4 mr-2" />
                Add
              </Button>
            </div>
          </div>
        </form>

        {/* Collaborators list */}
        {collaborators.length > 0 && (
          <div className="space-y-2">
            <Label>Current Collaborators</Label>
            <div className="space-y-2">
              {collaborators.map((collab) => (
                <div
                  key={collab.id}
                  className="flex items-center justify-between p-3 rounded-lg border bg-card"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-medium">{collab.username}</span>
                    <Badge variant={collab.role === "editor" ? "default" : "secondary"}>
                      {collab.role}
                    </Badge>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveCollaborator(collab.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ManageCollaborators;
