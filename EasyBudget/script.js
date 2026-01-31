// ------------------ VARIABLES ------------------
let username = null;
let budget = null;
let expenses = [];
let currentMonth = new Date().toISOString().slice(0,7); // YYYY-MM
let categoryTotals = {};

let pieChart, barChart;

// ------------------ LOGIN ------------------
document.getElementById("loginBtn").addEventListener("click", ()=>{
    const input = document.getElementById("usernameInput").value.trim();
    if(!input) return alert("Enter username");
    username = input;
    document.getElementById("loginCard").style.display = "none";
    document.getElementById("app").style.display = "block";
    loadData();
    render();
});

// ------------------ STORAGE KEYS ------------------
function storageKey() {
    return `EasyBudget_${username}_${currentMonth}`;
}

// ------------------ LOAD DATA ------------------
function loadData(){
    let data = JSON.parse(localStorage.getItem(storageKey()));
    if(data){
        budget = data.budget;
        expenses = data.expenses;
    }else{
        budget = null;
        expenses = [];
    }
}

// ------------------ SAVE DATA ------------------
function saveData(){
    localStorage.setItem(storageKey(), JSON.stringify({budget, expenses}));
}

// ------------------ SAVE BUDGET ------------------
function saveBudget(){
    const input = document.getElementById("budgetInput").value;
    if(input<=0) return alert("Enter valid budget");
    budget = Number(input);
    saveData();
    render();
}

// ------------------ EDIT BUDGET ------------------
function editBudget(){
    if(budget===null) return alert("No budget set to edit");
    const newBudget = prompt("Enter new monthly budget:", budget);
    if(newBudget===null || newBudget<=0) return;
    budget = Number(newBudget);
    saveData();
    render();
}

// ------------------ DELETE BUDGET ------------------
function deleteBudget(){
    if(budget===null) return alert("No budget set to delete");
    if(confirm("Are you sure you want to delete the budget?")){
        budget = null;
        saveData();
        render();
    }
}


// ------------------ ADD EXPENSE ------------------
function addExpense(){
    const name = document.getElementById("expenseName").value.trim();
    const amount = Number(document.getElementById("expenseAmount").value);
    const category = document.getElementById("expenseCategory").value;
    const date = document.getElementById("expenseDate").value;

    if(!name || !amount || !date) return alert("Enter valid expense");

    expenses.push({name, amount, category, date});
    saveData();

    document.getElementById("expenseName").value="";
    document.getElementById("expenseAmount").value="";
    document.getElementById("expenseDate").value="";

    render();
}

// ------------------ DELETE EXPENSE ------------------
function deleteExpense(index){
    expenses.splice(index,1);
    saveData();
    render();
}

// ------------------ EDIT EXPENSE ------------------
function editExpense(index){
    const exp = expenses[index];
    const newName = prompt("Edit Name", exp.name);
    if(newName===null) return;
    const newAmount = prompt("Edit Amount", exp.amount);
    if(newAmount===null) return;
    const newCategory = prompt("Edit Category", exp.category);
    if(newCategory===null) return;
    const newDate = prompt("Edit Date (YYYY-MM-DD)", exp.date);
    if(newDate===null) return;

    expenses[index] = {name:newName, amount:Number(newAmount), category:newCategory, date:newDate};
    saveData();
    render();
}

// ------------------ RESET MONTH ------------------
document.getElementById("resetMonthBtn").addEventListener("click", ()=>{
    if(confirm("Clear budget and all expenses?")){
        budget=null;
        expenses=[];
        saveData();
        render();
    }
});

// ------------------ EXPORT CSV ------------------
document.getElementById("exportCSVBtn").addEventListener("click", ()=>{
    if(expenses.length===0) return alert("No expenses to export");
    let csv = "Name,Amount,Category,Date\n";
    expenses.forEach(e=>{
        csv += `${e.name},${e.amount},${e.category},${e.date}\n`;
    });
    const blob = new Blob([csv],{type:"text/csv"});
    const link = document.createElement("a");
    link.href=URL.createObjectURL(blob);
    link.download=`EasyBudget_${currentMonth}.csv`;
    link.click();
});

// ------------------ RENDER UI ------------------
function render(){
    // Summary
    const summary=document.getElementById("summary");
    const totalSpentEl=document.getElementById("totalSpent");
    const remainingEl=document.getElementById("remaining");
    const budgetText=document.getElementById("budgetText");
    const expenseList=document.getElementById("expenseList");
    const catTotalsDiv=document.getElementById("categoryTotals");

    if(budget===null && expenses.length===0){
        summary.style.display="none";
        budgetText.innerText="";
        expenseList.innerHTML="";
        catTotalsDiv.innerHTML="";
        return;
    }

    budgetText.innerText = budget!==null?`Monthly Budget: ₹${budget}`:"";

    let totalSpent=0;
    categoryTotals={};

    expenseList.innerHTML="";
    expenses.forEach((exp,index)=>{
        totalSpent+=exp.amount;
        categoryTotals[exp.category]=(categoryTotals[exp.category]||0)+exp.amount;
        const li=document.createElement("li");
        li.innerHTML=`${exp.name} (${exp.category}) - ₹${exp.amount} [${exp.date}] 
            <span>
            <button onclick="editExpense(${index})">Edit</button>
            <button onclick="deleteExpense(${index})">Delete</button>
            </span>`;
        expenseList.appendChild(li);
    });

    totalSpentEl.innerText=totalSpent;
    remainingEl.innerText = budget!==null?budget-totalSpent:"—";
    remainingEl.className=(budget!==null && totalSpent>budget)?"negative":"";

    // Category totals
    let html="<h3>Category Totals</h3>";
    for(let cat in categoryTotals){
        html+=`<p>${cat}: ₹${categoryTotals[cat]}</p>`;
    }
    catTotalsDiv.innerHTML=html;

    summary.style.display="block";

    // Charts
    renderCharts();
}

// ------------------ RENDER CHARTS ------------------
function renderCharts(){
    const pieCtx=document.getElementById("pieChart").getContext("2d");
    const barCtx=document.getElementById("barChart").getContext("2d");

    const catLabels=Object.keys(categoryTotals);
    const catData=Object.values(categoryTotals);
    const colors=["#22c55e","#fbbf24","#3b82f6","#ef4444","#a855f7"];

    if(pieChart) pieChart.destroy();
    pieChart=new Chart(pieCtx,{
        type:"pie",
        data:{
            labels:catLabels,
            datasets:[{data:catData, backgroundColor: colors}]
        },
        options:{
            responsive:true,
            maintainAspectRatio:false
        }
    });

    if(barChart) barChart.destroy();
    barChart=new Chart(barCtx,{
        type:"bar",
        data:{
            labels:catLabels,
            datasets:[{label:"Category Spend", data:catData, backgroundColor:"#3b82f6"}]
        },
        options:{
            responsive:true,
            maintainAspectRatio:false,
            scales:{
                y:{beginAtZero:true}
            }
        }
    });
}
