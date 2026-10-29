$ErrorActionPreference = "Stop"

Write-Host "Adding files..."
git add .

Write-Host "Committing changes..."
if (git status --porcelain) {
    git commit -m "update frontend code"
} else {
    Write-Host "Nothing to commit locally."
}

Write-Host "Renaming current branch to deployment so push works..."
git branch -m deployment

Write-Host "Adding remote if not exists..."
# Target repository
$remoteUrl = "https://github.com/Aadithya1826/Food_Ordering_App_Frontend.git"
try {
    git remote add origin $remoteUrl
} catch {
    git remote set-url origin $remoteUrl
}

Write-Host "Pushing to deployment branch..."
git push origin deployment

Write-Host "Done!"
