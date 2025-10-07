import { createContext, useState, useEffect } from "react";
import { subjectAPI } from "../utils/api";

export const SubjectContext = createContext();

export function SubjectProvider({ children }) {
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchSubjects = async (branch = "cse") => {
    try {
      setLoading(true);
      const res = await subjectAPI.getSubjects({ branch });
      setSubjects(res.data || []);
    } catch (error) {
      console.error("Error fetching subjects:", error);
      setSubjects([]);
    } finally {
      setLoading(false);
    }
  };

  const addSubject = async (data) => {
    try {
      const res = await subjectAPI.createSubject(data);
      if (res.data) {
        setSubjects(prev => [...prev, res.data]);
      }
    } catch (error) {
      console.error("Error adding subject:", error);
    }
  };

  useEffect(() => {
    fetchSubjects();
  }, []);

  return (
    <SubjectContext.Provider value={{ 
      subjects, 
      addSubject, 
      fetchSubjects,
      loading 
    }}>
      {children}
    </SubjectContext.Provider>
  );
}