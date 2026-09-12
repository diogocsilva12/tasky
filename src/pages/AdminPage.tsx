import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { ConfirmDialog } from '../components/ui/confirm-dialog';
import { RefreshCw, Check, X, Shield, Users, UserPlus } from 'lucide-react';

export const AdminPage: React.FC = () => {
  const { 
    passList, 
    pendingRequests, 
    gistId, 
    refreshPassList, 
    approveRequest, 
    rejectRequest, 
    addUserToPassList, 
    revokeUserFromPassList 
  } = useAuth();
  
  const [newUsername, setNewUsername] = useState('');
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [userToRevoke, setUserToRevoke] = useState<string | null>(null);
  const [requestToReject, setRequestToReject] = useState<string | null>(null);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshPassList();
    setIsRefreshing(false);
  };

  const handleAddUser = async () => {
    if (newUsername.trim()) {
      await addUserToPassList(newUsername.trim(), 'member', 'https://avatars.githubusercontent.com/u/0?v=4');
      setNewUsername('');
      setIsAddUserOpen(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-5xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
          <p className="text-muted-foreground mt-1">Manage Tasky access control and pass-list.</p>
        </div>
        <div className="flex items-center gap-2">
          {gistId ? (
            <Badge variant="outline" className="text-green-600 bg-green-50 border-green-200">
              Gist Synced
            </Badge>
          ) : (
            <Badge variant="outline" className="text-yellow-600 bg-yellow-50 border-yellow-200">
              Local Mode
            </Badge>
          )}
          <Button variant="outline" size="icon" onClick={handleRefresh} disabled={isRefreshing}>
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{passList.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Requests</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingRequests.filter(r => r.status === 'pending').length}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="passlist" className="w-full">
        <TabsList>
          <TabsTrigger value="passlist">Pass-List</TabsTrigger>
          <TabsTrigger value="requests">Access Requests</TabsTrigger>
        </TabsList>
        
        <TabsContent value="passlist" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Approved Users</CardTitle>
                <CardDescription>Users who have access to Tasky.</CardDescription>
              </div>
              <Dialog open={isAddUserOpen} onOpenChange={setIsAddUserOpen}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <UserPlus className="h-4 w-4 mr-2" /> Add User
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add User to Pass-list</DialogTitle>
                    <DialogDescription>
                      Manually approve a GitHub username for access.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="py-4">
                    <Input 
                      placeholder="GitHub username" 
                      value={newUsername}
                      onChange={(e) => setNewUsername(e.target.value)}
                    />
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsAddUserOpen(false)}>Cancel</Button>
                    <Button onClick={handleAddUser}>Add User</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {passList.map((user) => (
                  <div key={user.username} className="flex items-center justify-between p-2 border rounded-md">
                    <div className="flex items-center space-x-4">
                      <Avatar>
                        <AvatarImage src={user.avatarUrl} />
                        <AvatarFallback>{user.username.substring(0, 2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium leading-none">{user.username}</p>
                        <p className="text-sm text-muted-foreground">
                          Approved by {user.approvedBy} on {new Date(user.approvedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                        {user.role}
                      </Badge>
                      {user.username.toLowerCase() !== 'diogocsilva12' && (
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => setUserToRevoke(user.username)}
                        >
                          Revoke
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="requests" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Pending Requests</CardTitle>
              <CardDescription>Review and approve access requests.</CardDescription>
            </CardHeader>
            <CardContent>
              {pendingRequests.filter(r => r.status === 'pending').length === 0 ? (
                <div className="text-center p-4 text-muted-foreground">No pending requests.</div>
              ) : (
                <div className="space-y-4">
                  {pendingRequests.filter(r => r.status === 'pending').map((request) => (
                    <div key={request.username} className="flex items-center justify-between p-2 border rounded-md">
                      <div className="flex items-center space-x-4">
                        <Avatar>
                          <AvatarImage src={request.avatarUrl} />
                          <AvatarFallback>{request.username.substring(0, 2).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium leading-none">{request.username}</p>
                          <p className="text-sm text-muted-foreground mt-1">
                            Note: {request.note || 'No note provided'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="icon"
                          className="text-green-600 hover:text-green-700"
                          onClick={() => approveRequest(request.username)}
                          title="Approve access"
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          className="text-red-600 hover:text-red-700"
                          onClick={() => setRequestToReject(request.username)}
                          title="Reject request"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Revoke Confirmation Dialog */}
      <ConfirmDialog
        open={Boolean(userToRevoke)}
        onOpenChange={(open) => !open && setUserToRevoke(null)}
        title="Revoke User Access"
        description={`Are you sure you want to revoke access for @${userToRevoke}? They will immediately lose access to Tasky boards.`}
        confirmText="Revoke Access"
        destructive
        onConfirm={() => {
          if (userToRevoke) {
            revokeUserFromPassList(userToRevoke);
            setUserToRevoke(null);
          }
        }}
      />

      {/* Reject Request Confirmation Dialog */}
      <ConfirmDialog
        open={Boolean(requestToReject)}
        onOpenChange={(open) => !open && setRequestToReject(null)}
        title="Reject Access Request"
        description={`Are you sure you want to reject the access request from @${requestToReject}?`}
        confirmText="Reject Request"
        destructive
        onConfirm={() => {
          if (requestToReject) {
            rejectRequest(requestToReject);
            setRequestToReject(null);
          }
        }}
      />
    </div>
  );
};
