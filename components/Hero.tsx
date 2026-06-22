export default function Hero() {
    return (
        <section className="grid justify-center align-center mt-15">
            <form action="" method="POST">
                <h2 className="text-6xl font-bold bg-[linear-gradient(90deg,#144EE3_0%,#EB568E_19%,#A353AA_64%,#144EE3_100%)] bg-clip-text text-transparent mb-5">Shorten your loooong links:)</h2>
                <p className="text-center text-base leading-[23.5px] font-light text-[#C9CED6] tracking-normal">Linkly is an efficient and easy-to-use URL shortening service that streamlines your online experience.</p>
                <div className="flex justify-self-center items-center gap-2 border-4 rounded-[48px] my-4 w-164.75 border-[#353C4A] bg-[#181E29] pl-6.25 pr-1 py-1">
                    <input type="text" placeholder="Enter the link here" className="flex-1 bg-transparent outline-none" />
                    <button className="flex items-center justify-center bg-[#144EE3] px-6 h-12 rounded-[48px] whitespace-nowrap">
                        Shorten now!
                    </button>
                </div>
            </form>
        </section>
    )
}