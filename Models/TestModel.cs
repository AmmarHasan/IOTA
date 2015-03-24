using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.ComponentModel.DataAnnotations;
using System.Web.Mvc;

namespace InteractiveLearning.Models
{
    public class CreateTest
    {
        public Test test { get; set; }
        public Question question { get; set; }
        public long testId { get; set; }
        public int noQ { get; set; }
        public bool pub { get; set; }
        [Display(Name = "Is test open for all ?")]
        public bool isopen { get; set; }
        public string imagedata { get; set; }
        public int noS { get; set; }
        public string[] sec { get; set; }
        public long secId { get; set; }
        public IList<TestSection> section { get; set; }
        public bool allSec { get; set; }
        public SelectList Departments { get; set; }
        public string type { get; set; }
        public string sections { get; set; }
        public string sec_ForOne { get; set; }
     
        public string secquesCount { get; set; }
       
     
    }

  
    public class ViewTest
    {
        public IList<Test> test { get; set; }
        public string type { get; set; }
        public string stat { get; set; } /////////////////////////////////////////////////
    }
    public class EditTest
    {
        public string sections { get; set; }
        public int[] secQues { get; set; }

        public Test test { get; set; }
        public IList<Question> ques { get; set; }
        public Question q { get; set; }
        public long testId { get; set; }
        public IList<TestSection> sec { get; set; }
        public TestSection s { get; set; }
        public long secId { get; set; }
           [Display(Name = "Is test open for all ?")]
     
        public bool isopen { get; set; }
        public SelectList Departments { get; set; }
        public string type { get; set; }
 
     
    }
    public class TakeTest
    {
        public long testId { get; set; }
        public Test test { get; set; }
        public IList<Question> ques { get; set; }
        public string[] ans{ get; set; }
        public int rankey { get; set; }
      
        public IList<TestSection> sec { get; set; }
        public string type { get; set; }
 
    }
    public class Result
    {
        public Grade gr { get; set; }
        public int noQ { get; set; }
        public Test t { get; set; }
        public IList<Question> ques { get; set; }
        public string[] ans { get; set; }
        public string type { get; set; }
 
    }
    public class VResult
    {
        public IList<Grade> g { get; set; }
        public long testID { get; set; }
        public string title { get; set; }
        public int outof { get; set; }

        public string type { get; set; }
 
    }
    public class grad
    {
        public int key { get; set; }
        public int num { get; set; }
        public string type { get; set; }
 
    }
    public class VGraph
    {
        public List<grad> g { get; set; }
        public int sum_std { get; set; }
        public string type { get; set; }
 
   }
    public class UploadQuestion
    {
        public long sec { get; set; }
        public SelectList Sections { get; set; }
        public long testid { get; set; }
    }
    public class Grades
    {
        public IList<Grade> g { get; set; }
        public long[] per { get; set; }
        public string type { get; set; }
    }
}