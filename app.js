function test(number1, number2){

    const names = ["Lee", "Dom", "Dan"]

   const lee =  {
        name: "Lee",
        age: "27"
    }

    names.forEach((v, i) => {
        console.log("VALUE : ", v, "INDEX : ", i)
    })


    for(let i = 0; i < names.length; i++)
    {
        console.log("VALUE : ", names[i])
    }

}


test(5,4)