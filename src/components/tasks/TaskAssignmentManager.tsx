import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useEmployees } from '@/hooks/useEmployees';
import { useTaskCRUD } from '@/hooks/useTaskCRUD';
import { SmartAssigneeSelect } from './SmartAssigneeSelect';
import { Users, UserPlus, UserMinus, TrendingUp } from 'lucide-react';
import type { Task } from '@/hooks/useTasks';

interface TaskAssignmentManagerProps {
  tasks: Task[];
  onTaskUpdate: () => void;
}

export const TaskAssignmentManager: React.FC<TaskAssignmentManagerProps> = ({
  tasks,
  onTaskUpdate
}) => {
  const { employees } = useEmployees();
  const { assignTask, loading } = useTaskCRUD();
  const [selectedTask, setSelectedTask] = useState<string>('');
  const [selectedEmployee, setSelectedEmployee] = useState<string>('');
  const [showSmartAssignee, setShowSmartAssignee] = useState(false);

  const unassignedTasks = tasks.filter(task => !task.assignee);
  const assignedTasks = tasks.filter(task => task.assignee);

  const handleAssignTask = async () => {
    if (!selectedTask || !selectedEmployee) return;
    
    try {
      await assignTask(selectedTask, selectedEmployee);
      setSelectedTask('');
      setSelectedEmployee('');
      onTaskUpdate();
    } catch (error) {
      console.error('Error assigning task:', error);
    }
  };

  const handleUnassignTask = async (taskId: string) => {
    try {
      await assignTask(taskId, '');
      onTaskUpdate();
    } catch (error) {
      console.error('Error unassigning task:', error);
    }
  };

  const getEmployeeById = (id: string) => {
    return employees.find(emp => emp.id === id);
  };

  const getTasksByEmployee = () => {
    const tasksByEmployee: { [key: string]: Task[] } = {};
    
    assignedTasks.forEach(task => {
      if (task.assignee) {
        if (!tasksByEmployee[task.assignee]) {
          tasksByEmployee[task.assignee] = [];
        }
        tasksByEmployee[task.assignee].push(task);
      }
    });
    
    return tasksByEmployee;
  };

  const tasksByEmployee = getTasksByEmployee();

  return (
    <div className="space-y-6">
      {/* Section d'assignation rapide */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Assignation Rapide
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">Tâche</label>
              <Select value={selectedTask} onValueChange={setSelectedTask}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner une tâche" />
                </SelectTrigger>
                <SelectContent>
                  {unassignedTasks.map((task) => (
                    <SelectItem key={task.id} value={task.id}>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {task.priority}
                        </Badge>
                        {task.title}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">Employé</label>
              <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un employé" />
                </SelectTrigger>
                <SelectContent>
                  {employees.map((employee) => (
                    <SelectItem key={employee.id} value={employee.id}>
                      <div className="flex items-center gap-2">
                        <Avatar className="w-6 h-6">
                          <AvatarImage src={employee.avatar_url || ''} />
                          <AvatarFallback className="text-xs">
                            {employee.full_name.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        {employee.full_name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex gap-2">
              <Button 
                onClick={handleAssignTask}
                disabled={!selectedTask || !selectedEmployee || loading}
              >
                Assigner
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowSmartAssignee(true)}
                disabled={!selectedTask}
              >
                <TrendingUp className="h-4 w-4 mr-2" />
                Sélection intelligente
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tâches non assignées */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserMinus className="h-5 w-5" />
            Tâches non assignées ({unassignedTasks.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {unassignedTasks.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">
              Toutes les tâches sont assignées
            </p>
          ) : (
            <div className="space-y-2">
              {unassignedTasks.map((task) => (
                <div key={task.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {task.priority}
                    </Badge>
                    <span className="font-medium">{task.title}</span>
                    <Badge variant="secondary" className="text-xs">
                      {task.status}
                    </Badge>
                  </div>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => setSelectedTask(task.id)}
                  >
                    Assigner
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tâches par employé */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Object.entries(tasksByEmployee).map(([employeeId, employeeTasks]) => {
          const employee = getEmployeeById(employeeId);
          if (!employee) return null;

          const completedTasks = employeeTasks.filter(t => t.status === 'done').length;
          const activeTasks = employeeTasks.filter(t => t.status === 'doing').length;
          const totalHours = employeeTasks.reduce((sum, t) => sum + t.effort_estimate_h, 0);

          return (
            <Card key={employeeId}>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage src={employee.avatar_url || ''} />
                    <AvatarFallback>
                      {employee.full_name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h4 className="font-medium">{employee.full_name}</h4>
                    <p className="text-sm text-muted-foreground">
                      {employeeTasks.length} tâche{employeeTasks.length > 1 ? 's' : ''} • {totalHours}h
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2 mb-3 text-xs">
                  <Badge variant="secondary">{completedTasks} terminées</Badge>
                  <Badge variant="default">{activeTasks} actives</Badge>
                </div>
                
                <div className="space-y-2">
                  {employeeTasks.slice(0, 3).map((task) => (
                    <div key={task.id} className="flex items-center justify-between text-sm">
                      <span className="truncate flex-1">{task.title}</span>
                      <div className="flex items-center gap-1">
                        <Badge 
                          variant={task.status === 'done' ? 'secondary' : 'outline'} 
                          className="text-xs"
                        >
                          {task.status}
                        </Badge>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 w-6 p-0"
                          onClick={() => handleUnassignTask(task.id)}
                        >
                          ×
                        </Button>
                      </div>
                    </div>
                  ))}
                  
                  {employeeTasks.length > 3 && (
                    <p className="text-xs text-muted-foreground text-center">
                      +{employeeTasks.length - 3} autres tâches
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <SmartAssigneeSelect
        open={showSmartAssignee}
        onOpenChange={setShowSmartAssignee}
        currentAssignee={selectedEmployee}
        onAssigneeSelect={(employeeId) => {
          setSelectedEmployee(employeeId);
          if (selectedTask) {
            handleAssignTask();
          }
        }}
        taskStartDate={selectedTask ? tasks.find(t => t.id === selectedTask)?.start_date || new Date().toISOString().split('T')[0] : new Date().toISOString().split('T')[0]}
        taskEndDate={selectedTask ? tasks.find(t => t.id === selectedTask)?.due_date || new Date().toISOString().split('T')[0] : new Date().toISOString().split('T')[0]}
        taskSkills={[]} // TODO: Extract skills from task
      />
    </div>
  );
};