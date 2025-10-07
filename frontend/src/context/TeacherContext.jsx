import { createContext, useState, useEffect } from "react";
import { teacherAPI } from "../utils/api";

export const TeacherContext = createContext();

export function TeacherProvider({ children }) {
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchTeachers = async () => {
    try {
      setLoading(true);
      const res = await teacherAPI.getAllTeachers();
      setTeachers(res.data || []);
    } catch (error) {
      console.error("Error fetching teachers:", error);
      setTeachers([]);
    } finally {
      setLoading(false);
    }
  };

  const addTeacher = async (data) => {
    try {
      const res = await teacherAPI.createTeacher(data);
      if (res.data) {
        setTeachers(prev => [...prev, res.data]);
      }
    } catch (error) {
      console.error("Error adding teacher:", error);
    }
  };

  const updateTeacher = async (id, data) => {
    try {
      const res = await teacherAPI.updateTeacher(id, data);
      if (res.data) {
        setTeachers(prev => prev.map(teacher => 
          teacher._id === id ? res.data : teacher
        ));
      }
    } catch (error) {
      console.error("Error updating teacher:", error);
    }
  };

  const deleteTeacher = async (id) => {
    try {
      await teacherAPI.deleteTeacher(id);
      setTeachers(prev => prev.filter(teacher => teacher._id !== id));
    } catch (error) {
      console.error("Error deleting teacher:", error);
    }
  };

  useEffect(() => {
    fetchTeachers();
  }, []);

  return (
    <TeacherContext.Provider value={{ 
      teachers, 
      addTeacher, 
      updateTeacher,
      deleteTeacher,
      fetchTeachers, 
      loading 
    }}>
      {children}
    </TeacherContext.Provider>
  );
}