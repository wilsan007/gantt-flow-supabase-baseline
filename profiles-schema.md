# Schéma de la table profiles

## Informations générales
- **Table**: profiles
- **Schéma**: public
- **Date d'export**: 2025-09-20T22:56:27.714Z
- **Nombre de colonnes**: 18
- **Nombre de contraintes**: 0
- **Nombre d'index**: 0
- **Nombre de politiques RLS**: 0

## Structure des colonnes

| Colonne | Type | Nullable | Défaut | Position |
|---------|------|----------|--------|----------|
| id | uuid | UNKNOWN | N/A | 1 |
| user_id | uuid | UNKNOWN | N/A | 2 |
| full_name | text | UNKNOWN | N/A | 3 |
| avatar_url | nullable | YES | N/A | 4 |
| role | text | UNKNOWN | N/A | 5 |
| created_at | text | UNKNOWN | N/A | 6 |
| updated_at | text | UNKNOWN | N/A | 7 |
| tenant_id | uuid | UNKNOWN | N/A | 8 |
| employee_id | nullable | YES | N/A | 9 |
| hire_date | nullable | YES | N/A | 10 |
| job_title | nullable | YES | N/A | 11 |
| manager_id | nullable | YES | N/A | 12 |
| salary | nullable | YES | N/A | 13 |
| contract_type | text | UNKNOWN | N/A | 14 |
| weekly_hours | integer | UNKNOWN | N/A | 15 |
| phone | nullable | YES | N/A | 16 |
| emergency_contact | nullable | YES | N/A | 17 |
| email | nullable | YES | N/A | 18 |

## Contraintes

Aucune contrainte

## Index

Aucun index

## Politiques RLS

Aucune politique RLS

## Colonnes détaillées


### id
- **Type**: uuid
- **Nullable**: UNKNOWN
- **Défaut**: N/A
- **Position**: 1


### user_id
- **Type**: uuid
- **Nullable**: UNKNOWN
- **Défaut**: N/A
- **Position**: 2


### full_name
- **Type**: text
- **Nullable**: UNKNOWN
- **Défaut**: N/A
- **Position**: 3


### avatar_url
- **Type**: nullable
- **Nullable**: YES
- **Défaut**: N/A
- **Position**: 4


### role
- **Type**: text
- **Nullable**: UNKNOWN
- **Défaut**: N/A
- **Position**: 5


### created_at
- **Type**: text
- **Nullable**: UNKNOWN
- **Défaut**: N/A
- **Position**: 6


### updated_at
- **Type**: text
- **Nullable**: UNKNOWN
- **Défaut**: N/A
- **Position**: 7


### tenant_id
- **Type**: uuid
- **Nullable**: UNKNOWN
- **Défaut**: N/A
- **Position**: 8


### employee_id
- **Type**: nullable
- **Nullable**: YES
- **Défaut**: N/A
- **Position**: 9


### hire_date
- **Type**: nullable
- **Nullable**: YES
- **Défaut**: N/A
- **Position**: 10


### job_title
- **Type**: nullable
- **Nullable**: YES
- **Défaut**: N/A
- **Position**: 11


### manager_id
- **Type**: nullable
- **Nullable**: YES
- **Défaut**: N/A
- **Position**: 12


### salary
- **Type**: nullable
- **Nullable**: YES
- **Défaut**: N/A
- **Position**: 13


### contract_type
- **Type**: text
- **Nullable**: UNKNOWN
- **Défaut**: N/A
- **Position**: 14


### weekly_hours
- **Type**: integer
- **Nullable**: UNKNOWN
- **Défaut**: N/A
- **Position**: 15


### phone
- **Type**: nullable
- **Nullable**: YES
- **Défaut**: N/A
- **Position**: 16


### emergency_contact
- **Type**: nullable
- **Nullable**: YES
- **Défaut**: N/A
- **Position**: 17


### email
- **Type**: nullable
- **Nullable**: YES
- **Défaut**: N/A
- **Position**: 18

