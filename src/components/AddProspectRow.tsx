import React, { useState } from 'react';
import { Card } from './ui/card';
import { Plus, User } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';

interface AddProspectRowProps {
  onAdd: (data: any) => void;
}

export function AddProspectRow({ onAdd }: AddProspectRowProps) {
  const [formData, setFormData] = useState({
    name: '', age: '', position: '', height: '', weight: '', attributes: '', notes: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleAdd = () => {
    if (!formData.name) return;
    onAdd(formData);
    setFormData({ name: '', age: '', position: '', height: '', weight: '', attributes: '', notes: '' });
  };

  return (
    <Card className="p-2 border-2 border-dashed border-border hover:border-accent-green/50 transition-all bg-card/40">
      <div className="flex items-center gap-4">
        <div className="w-8 h-8 flex items-center justify-center shrink-0">
          <User className="w-6 h-6 text-muted-foreground" />
        </div>
        <div className="flex-grow grid grid-cols-7 gap-2">
          <Input name="name" placeholder="Name" value={formData.name} onChange={handleChange} className="h-8 text-xs" />
          <Input name="position" placeholder="Pos" value={formData.position} onChange={handleChange} className="h-8 text-xs" />
          <Input name="age" placeholder="Age" value={formData.age} onChange={handleChange} className="h-8 text-xs" />
          <Input name="height" placeholder="Height" value={formData.height} onChange={handleChange} className="h-8 text-xs" />
          <Input name="weight" placeholder="Weight" value={formData.weight} onChange={handleChange} className="h-8 text-xs" />
          <Input name="attributes" placeholder="Attrs" value={formData.attributes} onChange={handleChange} className="h-8 text-xs" />
          <Input name="notes" placeholder="Notes" value={formData.notes} onChange={handleChange} className="h-8 text-xs" />
        </div>
        <Button onClick={handleAdd} size="sm" className="bg-accent-green text-black hover:bg-accent-green/90">
          <Plus className="w-4 h-4" />
        </Button>
      </div>
    </Card>
  );
}
