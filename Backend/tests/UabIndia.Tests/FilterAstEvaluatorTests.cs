using System;
using System.Collections.Generic;
using System.Linq;
using UabIndia.Application.Common;
using Xunit;

namespace UabIndia.Tests
{
    public class FilterAstEvaluatorTests
    {
        public class EmployeeTestRecord
        {
            public Guid Id { get; set; } = Guid.NewGuid();
            public string FullName { get; set; } = string.Empty;
            public string Department { get; set; } = string.Empty;
            public string Status { get; set; } = "Active";
            public decimal BasicSalary { get; set; }
            public int Age { get; set; }
            public bool IsConfirmed { get; set; }
            public string? Notes { get; set; }
            public DateTime JoiningDate { get; set; }
        }

        private static List<EmployeeTestRecord> GetSampleRecords()
        {
            return new List<EmployeeTestRecord>
            {
                new() { FullName = "Aarav Sharma", Department = "Engineering", Status = "Active", BasicSalary = 60000m, Age = 28, IsConfirmed = true, Notes = "Senior Engineer", JoiningDate = new DateTime(2022, 1, 15) },
                new() { FullName = "Diya Patel", Department = "Engineering", Status = "Probation", BasicSalary = 45000m, Age = 24, IsConfirmed = false, Notes = null, JoiningDate = new DateTime(2023, 6, 1) },
                new() { FullName = "Rohan Verma", Department = "Sales", Status = "Active", BasicSalary = 55000m, Age = 32, IsConfirmed = true, Notes = "Lead Sales", JoiningDate = new DateTime(2021, 3, 10) },
                new() { FullName = "Priya Nair", Department = "Human Resources", Status = "Active", BasicSalary = 50000m, Age = 29, IsConfirmed = true, Notes = "", JoiningDate = new DateTime(2020, 8, 20) },
                new() { FullName = "Vikram Singh", Department = "Sales", Status = "Terminated", BasicSalary = 40000m, Age = 35, IsConfirmed = true, Notes = "Exited", JoiningDate = new DateTime(2019, 11, 5) }
            };
        }

        [Fact]
        public void Evaluate_SimpleAndCondition_FiltersCorrectly()
        {
            var records = GetSampleRecords().AsQueryable();

            var group = new FilterGroup
            {
                Combinator = FilterCombinator.And,
                Conditions = new List<FilterCondition>
                {
                    new() { Field = "Department", Operator = "eq", Value = "Engineering" },
                    new() { Field = "Status", Operator = "eq", Value = "Active" }
                }
            };

            var filtered = records.ApplyFilterAst(group).ToList();

            Assert.Single(filtered);
            Assert.Equal("Aarav Sharma", filtered[0].FullName);
        }

        [Fact]
        public void Evaluate_CompoundOrAndGroup_FiltersCorrectly()
        {
            // Expression: (Department == "Engineering" AND BasicSalary >= 50000) OR (Department == "Sales" AND Status == "Active")
            var records = GetSampleRecords().AsQueryable();

            var group = new FilterGroup
            {
                Combinator = FilterCombinator.Or,
                Groups = new List<FilterGroup>
                {
                    new()
                    {
                        Combinator = FilterCombinator.And,
                        Conditions = new List<FilterCondition>
                        {
                            new() { Field = "Department", Operator = "eq", Value = "Engineering" },
                            new() { Field = "BasicSalary", Operator = "gte", Value = 50000m }
                        }
                    },
                    new()
                    {
                        Combinator = FilterCombinator.And,
                        Conditions = new List<FilterCondition>
                        {
                            new() { Field = "Department", Operator = "eq", Value = "Sales" },
                            new() { Field = "Status", Operator = "eq", Value = "Active" }
                        }
                    }
                }
            };

            var filtered = records.ApplyFilterAst(group).ToList();

            // Should match Aarav Sharma (Engineering & 60k) and Rohan Verma (Sales & Active)
            Assert.Equal(2, filtered.Count);
            Assert.Contains(filtered, x => x.FullName == "Aarav Sharma");
            Assert.Contains(filtered, x => x.FullName == "Rohan Verma");
        }

        [Fact]
        public void Evaluate_StringContainsAndStarts_CaseInsensitive()
        {
            var records = GetSampleRecords().AsQueryable();

            var group = new FilterGroup
            {
                Combinator = FilterCombinator.And,
                Conditions = new List<FilterCondition>
                {
                    new() { Field = "FullName", Operator = "contains", Value = "sharma" },
                    new() { Field = "Notes", Operator = "starts", Value = "senior" }
                }
            };

            var filtered = records.ApplyFilterAst(group).ToList();

            Assert.Single(filtered);
            Assert.Equal("Aarav Sharma", filtered[0].FullName);
        }

        [Fact]
        public void Evaluate_EmptyAndNonEmptyOperators()
        {
            var records = GetSampleRecords().AsQueryable();

            // Find records where Notes is empty or null (Diya Patel has null, Priya Nair has "")
            var emptyGroup = new FilterGroup
            {
                Combinator = FilterCombinator.And,
                Conditions = new List<FilterCondition>
                {
                    new() { Field = "Notes", Operator = "empty" }
                }
            };

            var emptyRecords = records.ApplyFilterAst(emptyGroup).ToList();
            Assert.Equal(2, emptyRecords.Count);
            Assert.Contains(emptyRecords, x => x.FullName == "Diya Patel");
            Assert.Contains(emptyRecords, x => x.FullName == "Priya Nair");

            // Find records where Notes is NOT empty
            var nonEmptyGroup = new FilterGroup
            {
                Combinator = FilterCombinator.And,
                Conditions = new List<FilterCondition>
                {
                    new() { Field = "Notes", Operator = "nempty" }
                }
            };

            var nonEmptyRecords = records.ApplyFilterAst(nonEmptyGroup).ToList();
            Assert.Equal(3, nonEmptyRecords.Count);
            Assert.DoesNotContain(nonEmptyRecords, x => x.FullName == "Diya Patel");
            Assert.DoesNotContain(nonEmptyRecords, x => x.FullName == "Priya Nair");
        }

        [Fact]
        public void Evaluate_JsonAstParsingAndExecution()
        {
            var records = GetSampleRecords().AsQueryable();

            var json = @"{
                ""combinator"": ""OR"",
                ""rules"": [
                    {
                        ""combinator"": ""AND"",
                        ""rules"": [
                            { ""field"": ""Department"", ""operator"": ""eq"", ""value"": ""Engineering"" },
                            { ""field"": ""Age"", ""operator"": ""lt"", ""value"": 26 }
                        ]
                    },
                    {
                        ""combinator"": ""AND"",
                        ""rules"": [
                            { ""field"": ""Status"", ""operator"": ""eq"", ""value"": ""Terminated"" }
                        ]
                    }
                ]
            }";

            var group = FilterAstEvaluator.ParseFromJson(json);
            Assert.NotNull(group);

            var filtered = records.ApplyFilterAst(group).ToList();

            // Matches Diya Patel (Engineering & Age 24 < 26) + Vikram Singh (Terminated)
            Assert.Equal(2, filtered.Count);
            Assert.Contains(filtered, x => x.FullName == "Diya Patel");
            Assert.Contains(filtered, x => x.FullName == "Vikram Singh");
        }
    }
}
