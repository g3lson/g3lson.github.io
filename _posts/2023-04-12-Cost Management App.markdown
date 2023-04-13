---

title: Aplicacion "CostManagement" para manejo de consumo de subscripciones de Azure

author: Mr. g3lson's Vibox

category: "Linux, Azure"

tags: "Linux, Azure, Cost Analytics, Bash, Scripts"

img: ":post_pic1.jpg"

date: 2023-04-12 08:11:06 +0900

comments_disable: false

---

<!-- outline-start -->

En esta pagina se muestra un script que se puede utilizar para el proceso de recoleccion de consumo de subscripciones de Azure de manera automatizada.

<!-- outline-end -->

## Introduccion
{:data-align="center"}

***

### Que es Bash?

**GNU Bash** o simplemente Bash (Bourne-again shell) es una popular interfaz de usuario de línea de comandos, específicamente un shell de Unix; así como un lenguaje de scripting. Bash fue originalmente escrito por Brian Fox para el sistema operativo GNU, y pretendía ser el reemplazo de software libre del shell Bourne.1​ 2​ Lanzado por primera vez en 1989,3​ se ha utilizado ampliamente como el intérprete de inicio de sesión (login) predeterminado para la mayoría de las distribuciones de GNU/Linux, y también de Mac OS X de Apple hasta la versión 10.15.4​ Una versión también está disponible para Windows 10 y Android. 5​ También es el intérprete de órdenes de usuario predeterminado en Solaris 11.6​

Bash es un intérprete de órdenes que generalmente se ejecuta en una ventana de texto donde el usuario escribe órdenes en modo texto. Bash también puede leer y ejecutar órdenes desde un archivo, llamado guion o 'script'. Al igual que todos los intérpretes de `Unix`, es compatible con el agrupamiento de nombres de archivo (coincidencia de comodines), tuberías, here documents, sustitución de comandos, variables y estructuras de control para pruebas de condición e iteración. Las palabras reservadas, la sintaxis, las variables de ámbito dinámico y otras características básicas del lenguaje se copian de sh. Otras características, por ejemplo, el historial, se copian de csh y ksh. Bash es un intérprete de órdenes compatible con POSIX, pero con varias extensiones.

### Que es Azure? 

Azure es la plataforma pública en la nube de Microsoft. Azure ofrece una amplia gama de servicios, lo que incluye las funcionalidades de plataforma como servicio (PaaS), infraestructura como servicio (IaaS) y servicio de base de datos administrado. Sin embargo, ¿qué es exactamente Azure y cómo funciona?

Azure, al igual que otras plataformas en la nube, se basa en una tecnología conocida como virtualización. La mayoría del hardware del equipo se puede emular en software. El hardware del equipo es simplemente un conjunto de instrucciones, que se codifican de forma permanente o semi permanente en silicio. Las capas de emulación se usan para asignar instrucciones de software a instrucciones de hardware. Las capas de emulación permiten que se ejecute hardware virtualizado en software como el propio hardware real.

### Script de bash para obtencion de consumo en subscripciones de Azure

Sin mas demora aqui el script espero que los disfruten :-)


```bash

#/bin/bash

# Author: Gelson Reynoso (aka g3lson) - vibox

#Colours
greenColour="\e[0;32m\033[1m"
endColour="\033[0m\e[0m"
redColour="\e[0;31m\033[1m"
blueColour="\e[0;34m\033[1m"
yellowColour="\e[0;33m\033[1m"
purpleColour="\e[0;35m\033[1m"
turquoiseColour="\e[0;36m\033[1m"
grayColour="\e[0;37m\033[1m"

# Variables globales:

parameter_counter=0
oC_parameter_counter=0
oN_parameter_counter=0
header_validation=0

# Functions:

trap ctrl_c INT

function ctrl_c(){
	echo -e "\n${redColour}[!] Saliendo...\n${endColour}"
    exit 1
}

function helpPanel(){
    echo -e "\n${redColour}[!] Uso: costmanagement${endColour}"
    for i in $(seq 1 80); do echo -ne "${redColour}-"; done; echo -ne "${endColour}"
    echo -e "\n\n\t${blueColour}Help panel ${endColour}"
    echo -e "\n\t${grayColour} [-h]${endColour}${yellowColour} Show help panel menu ${endColour}"
    echo -e "\n\n\t${blueColour}Get consumption - Required ${endColour}"
    echo -e "\n\t${grayColour} [-s]${endColour}${yellowColour} Start date for consumption on Subscription: "aaaa-mm-dd" ${endColour}"
    echo -e "\n\t${grayColour} [-e]${endColour}${yellowColour} End date for consumption on Subscription: "aaaa-mm-dd"${endColour}"
    echo -e "\n\n\t${blueColour}Export output - Optional ${endColour}"
    echo -e "\n\t${grayColour} [-o]${endColour}${yellowColour} Export consumption result in normal output format - '"format table"'${endColour}"
    echo -e "\n\t${grayColour} [-v]${endColour}${yellowColour} Export consumption result in CSV output format - '"CSV format"'${endColour}"
    echo -e "\n\n\t${blueColour}Show consumption exported ${endColour}"
    echo -e "\n\t${grayColour} [-d]${endColour}${yellowColour} Display an existent CSV output format file on format table "format table"${endColour}"
    echo -e "\n${purpleColour} Example: costmanagement -s 2020-01-01 -e 2020-01-30 -o output.txt ${endColour}\n"
}

function display(){
    echo ""
    column -t -s ',' $display
    echo ""
}

while getopts "s:e:v:o:d:h:" arg; do
    case $arg in 
        e) end_date=$OPTARG; let parameter_counter+=1;;
        s) start_date=$OPTARG;;
        v) outputC=$OPTARG; let oC_parameter_counter+=1;;
        o) outputN=$OPTARG; let oN_parameter_counter+=1;;
        d) display=$OPTARG; let parameter_counter+=2;;
        h) helpPanel;;
    esac
done


if [[ $parameter_counter -eq 0 ]]; then
    helpPanel

elif [[ $parameter_counter -eq 2 ]]; then
    display

else
    
    function header_consumption (){
        echo -e "\n${grayColour}Subscription Name \t\t\t SuscriptionID \t\t\t\t\t Budget \t ActualCost \t Diferencia ${endColour}\n"
    }


    header_consumption
    for sub in $( curl https://raw.githubusercontent.com/holasoygelson/costmanagement/main/subs.txt 2> /dev/null ) ; do   
        sub_id=$( echo $sub | cut -d ',' -f1 )
        budget=$( echo $sub | cut -d ',' -f2 )
        subscription_name=$(az account show --subscription $sub_id --query name)
        actual_cost=$(az consumption usage list --subscription $sub_id --start-date $start_date --end-date $end_date --query [].pretaxCost --only-show-errors | cut -d '"' -f2 | tail -n +2 | grep -v ']' | awk '{n += $1}; END{print n}' | cut -d '.' -f1)
            
        if [[ "$actual_cost" == '' ]]; then     
                actual_cost=0
        fi

        diferencial_consumption=$(( $budget - $actual_cost ))
        if [[ "$diferencial_consumption" -lt '0' ]]; then
                diferencialColour="\e[0;31m\033[1m"
        else
                diferencialColour="\e[0;32m\033[1m"
        fi

        function consumption(){
            echo -e "${grayColour} $subscription_name \t\t\t\t\t $sub_id \t\t $budget \t\t $actual_cost \t\t ${endColour} ${diferencialColour} $diferencial_consumption ${endColour}"
        }

        consumption

        if [[ $oN_parameter_counter -eq 1 ]]; then
            if [[ $header_validation -eq 0 ]]; then
                header_consumption > $outputN
                header_validation=$((header_validation+1))
            fi
            consumption >> $outputN
        fi

        if [[ $oC_parameter_counter -eq 1 ]]; then
            if [[ $header_validation -eq 0 ]]; then
                printf '%s\n' "SuscriptionID" "Budget" "ActualCost" "Diferencia" "SubscriptionName" | paste -sd ',' > $outputC
                header_validation=$((header_validation+1))
            fi
            echo -e "$sub_id,$budget,$actual_cost,$diferencial_consumption,$subscription_name" >> $outputC

            #printf '%s\n' ${subscription_name} ${sub_id} ${budget} ${actual_cost} ${diferencial_consumption} | paste -sd ',' >> $outputC

        fi
    done
    echo " "
fi

```

Hasta la proxima amigos!!!